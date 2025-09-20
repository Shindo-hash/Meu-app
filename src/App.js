// src/App.js
import React, { useState, useEffect } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [banca, setBanca] = useState(0);
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await carregarDados(currentUser.uid);
      } else {
        setUser(null);
        setBanca(0);
        setHistorico([]);
      }
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      await carregarDados(result.user.uid);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const carregarDados = async (uid) => {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const entradas = data.entradas || [];
      const saidas = data.saidas || [];
      const cats = data.categorias || ["Lanche", "Transporte", "Outros"];
      setCategorias(cats);
      setHistorico([
        ...entradas.map((e) => ({ ...e, tipo: "entrada" })),
        ...saidas.map((s) => ({ ...s, tipo: "saida" }))
      ]);
      setBanca(data.bancaInicial + calcularTotal(entradas) - calcularTotal(saidas));
    } else {
      const valorInicial = parseFloat(prompt("Bem-vindo! Qual sua banca inicial?"));
      if (!isNaN(valorInicial)) {
        await setDoc(userRef, { bancaInicial: valorInicial, entradas: [], saidas: [], categorias: ["Lanche", "Transporte", "Outros"] });
        setBanca(valorInicial);
        setHistorico([]);
        setCategorias(["Lanche", "Transporte", "Outros"]);
      }
    }
  };

  const calcularTotal = (arr) => arr.reduce((acc, cur) => acc + cur.valor, 0);

  const adicionarMovimentacao = async (tipo) => {
    const val = parseFloat(valor);
    if (!isNaN(val) && categoria.trim() !== "") {
      const novoItem = { valor: val, categoria, data: new Date().toISOString() };
      const userRef = doc(db, "users", user.uid);
      if (tipo === "entrada") {
        await updateDoc(userRef, { entradas: arrayUnion(novoItem) });
      } else {
        await updateDoc(userRef, { saidas: arrayUnion(novoItem) });
      }
      await carregarDados(user.uid);
      setValor("");
      setCategoria("");
    } else {
      alert("Informe o valor e a categoria!");
    }
  };

  const adicionarNovaCategoria = async () => {
    if (novaCategoria.trim() === "") return;
    const userRef = doc(db, "users", user.uid);
    if (!categorias.includes(novaCategoria)) {
      await updateDoc(userRef, { categorias: arrayUnion(novaCategoria) });
      setCategorias([...categorias, novaCategoria]);
    }
    setNovaCategoria("");
  };

  const excluirMovimentacao = async (item) => {
    if (!window.confirm("Tem certeza que deseja excluir esta movimentação?")) return;
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let entradas = data.entradas || [];
      let saidas = data.saidas || [];

      if (item.tipo === "entrada") {
        entradas = entradas.filter(
          (e) => !(e.valor === item.valor && e.categoria === item.categoria && e.data === item.data)
        );
      } else {
        saidas = saidas.filter(
          (s) => !(s.valor === item.valor && s.categoria === item.categoria && s.data === item.data)
        );
      }

      await setDoc(userRef, { ...data, entradas, saidas });
      await carregarDados(user.uid);
    }
  };

  const dadosGrafico = historico.map((item) => ({
    data: new Date(item.data).toLocaleDateString(),
    valor: item.tipo === "entrada" ? item.valor : -item.valor
  }));

  const dadosPizza = [
    { name: "Entradas", value: historico.filter((h) => h.tipo === "entrada").reduce((acc, cur) => acc + cur.valor, 0) },
    { name: "Saídas", value: historico.filter((h) => h.tipo === "saida").reduce((acc, cur) => acc + cur.valor, 0) }
  ];

  const cores = ["#66fcf1", "#c3073f"];

  if (loading) return <div className="container"><p>Carregando...</p></div>;

  return (
    <div className="container">
      <h1 className="titulo">🎰 Meu App de Banca 🎲</h1>

      {!user ? (
        <button className="button-login" onClick={loginWithGoogle}>Login com Google</button>
      ) : (
        <div>
          <p className="user-info">Olá, <strong>{user.displayName}</strong>!</p>
          <p className="user-email">Email: {user.email}</p>
          <button className="button-logout" onClick={logout}>Sair</button>

          <h2 className="banca">💰 Banca: ${banca.toFixed(2)}</h2>

          <div className="movimentacoes">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input">
              <option value="">Selecione a categoria</option>
              {categorias.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
            </select>
            <input type="number" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} className="input"/>
            <button className="button-entrada" onClick={() => adicionarMovimentacao("entrada")}>Adicionar Entrada</button>
            <button className="button-saida" onClick={() => adicionarMovimentacao("saida")}>Adicionar Saída</button>
          </div>

          <div className="nova-categoria">
            <input type="text" placeholder="Nova categoria" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} className="input"/>
            <button className="button-entrada" onClick={adicionarNovaCategoria}>Adicionar Categoria</button>
          </div>

          <div className="historico">
            <h3>Histórico:</h3>
            {historico.length === 0 ? <p>Nenhuma movimentação ainda.</p> :
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historico].reverse().map((item, index) => (
                    <tr key={index}>
                      <td>{item.categoria}</td>
                      <td>{item.tipo === "entrada" ? "Entrada" : "Saída"}</td>
                      <td>${item.valor.toFixed(2)}</td>
                      <td>{new Date(item.data).toLocaleString()}</td>
                      <td>
                        <button className="button-excluir" onClick={() => excluirMovimentacao(item)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>

          <div className="graficos">
            <div className="grafico">
              <h3>📊 Evolução das movimentações:</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#45a29e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico">
              <h3>🥧 Entradas vs Saídas:</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dadosPizza} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
