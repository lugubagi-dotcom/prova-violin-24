import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://jsonplaceholder.typicode.com/posts';

const estadoInicial = { title: '', body: '' };

function FormularioAviso({
  form,
  setForm,
  onSubmit,
  editandoId,
  onCancelar,
  mensagemFormulario,
}) {
  const handleChange = (campo) => (event) => {
    setForm((prev) => ({
      ...prev,
      [campo]: event.target.value,
    }));
  };

  return (
    <section className="painel">
      <h2>{editandoId ? 'Editar aviso' : 'Novo aviso'}</h2>

      <form onSubmit={onSubmit} className="form-aviso">
        <label>
          Título
          <input
            type="text"
            value={form.title}
            onChange={handleChange('title')}
            placeholder="Digite o título"
          />
        </label>

        <label>
          Texto do aviso
          <textarea
            value={form.body}
            onChange={handleChange('body')}
            placeholder="Escreva o aviso..."
            rows="6"
          />
        </label>

        {mensagemFormulario && (
          <p className="mensagem-formulario">{mensagemFormulario}</p>
        )}

        <div className="botoes-form">
          <button type="submit" className="botao-principal">
            {editandoId ? 'Salvar' : 'Publicar aviso'}
          </button>

          {editandoId && (
            <button
              type="button"
              className="botao-secundario"
              onClick={onCancelar}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function CartaoAviso({ aviso, onEditar, onExcluir }) {
  return (
    <article className="cartao">
      <div className="cartao-cabecalho">
        <h3>{aviso.title}</h3>
      </div>

      <p className="cartao-body">{aviso.body}</p>

      <div className="cartao-meta">
        <span>ID: {aviso.id}</span>
        <span>Autor: {aviso.userId}</span>
      </div>

      <div className="cartao-acoes">
        <button type="button" className="botao-editar" onClick={() => onEditar(aviso)}>
          Editar
        </button>
        <button type="button" className="botao-excluir" onClick={() => onExcluir(aviso.id)}>
          Excluir
        </button>
      </div>
    </article>
  );
}

function ListaAvisos({ avisos, onEditar, onExcluir }) {
  if (avisos.length === 0) {
    return (
      <p className="mensagem-vazia">
        Nenhum aviso publicado
      </p>
    );
  }

  return (
    <div className="lista">
      {avisos.map((aviso) => (
        <CartaoAviso
          key={aviso.id}
          aviso={aviso}
          onEditar={onEditar}
          onExcluir={onExcluir}
        />
      ))}
    </div>
  );
}

function App() {
  const [avisos, setAvisos] = useState([]);
  const [form, setForm] = useState(estadoInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [mensagemFormulario, setMensagemFormulario] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function buscarAvisos() {
      try {
        const response = await fetch(`${API_URL}?_limit=15`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar avisos');
        }

        const data = await response.json();
        setAvisos(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErroCarregamento(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    buscarAvisos();

    return () => controller.abort();
  }, []);

  const limparFormulario = () => {
    setForm(estadoInicial);
    setEditandoId(null);
    setMensagemFormulario('');
  };

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      setMensagemFormulario('Preencha o título e o texto antes de publicar');
      return;
    }

    const payload = {
      userId: 1,
      title: form.title.trim(),
      body: form.body.trim(),
    };

    try {
      if (editandoId) {
        const response = await fetch(`${API_URL}/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar aviso');
        }

        const data = await response.json();

        setAvisos((prev) =>
          prev.map((aviso) =>
            aviso.id === editandoId ? { ...aviso, ...data } : aviso
          )
        );
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar aviso');
        }

        const data = await response.json();

        setAvisos((prev) => [data, ...prev]);
      }

      limparFormulario();
    } catch (error) {
      setMensagemFormulario('Não foi possível salvar o aviso. Tente novamente.');
    }
  }

  async function handleExcluir(id) {
    const avisoOriginal = avisos.find((aviso) => aviso.id === id);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir aviso');
      }

      setAvisos((prev) => prev.filter((aviso) => aviso.id !== id));
    } catch (error) {
      if (avisoOriginal) {
        setAvisos((prev) => [avisoOriginal, ...prev]);
      }
      setMensagemFormulario('Não foi possível excluir o aviso. Tente novamente.');
    }
  }

  function handleEditar(aviso) {
    setEditandoId(aviso.id);
    setForm({
      title: aviso.title,
      body: aviso.body,
    });
    setMensagemFormulario('');
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <h1>Mural de Avisos</h1>
      </header>

      <main className="layout">
        <FormularioAviso
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          editandoId={editandoId}
          onCancelar={limparFormulario}
          mensagemFormulario={mensagemFormulario}
        />

        <section className="painel painel-lista">
          {carregando && <p className="status">Carregando avisos...</p>}

          {!carregando && erroCarregamento && (
            <p className="status erro-status">
              Não foi possível conectar à API
            </p>
          )}

          {!carregando && !erroCarregamento && (
            <ListaAvisos
              avisos={avisos}
              onEditar={handleEditar}
              onExcluir={handleExcluir}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;