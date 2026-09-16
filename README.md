# Mapa Conceitual — Bacharelado em Sistemas de Informação (IFMG Ouro Branco)

Mapa mental/conceitual interativo do curso de **Bacharelado em Sistemas de Informação** do **IFMG — Campus Ouro Branco**, criado para ajudar estudantes do ensino médio a entender a estrutura do curso antes de se inscrever.

Trabalho **individual** da disciplina *"Atividade Mapa Conceitual/Mental 2026"*.
**Autor:** Kaiky Pires

🔗 **Site publicado:** _[adicionar aqui o link do GitHub Pages após o deploy]_

## O que o mapa mostra

Diferente de um roteiro linear (tipo roadmap.sh, que mostra um único caminho até um único objetivo), este mapa é um grafo navegável com **três tipos de nós**:

- **Área** — grande agrupamento temático de disciplinas do curso (ex.: *Redes, Sistemas Operacionais e Infraestrutura*).
- **Disciplina** — disciplina obrigatória ou optativa do curso, com carga horária, período e pré-requisitos.
- **Carreira** — possibilidade profissional do egresso, citada no PPC do curso.

As conexões mostram **Área → Disciplinas** que a compõem e **Disciplina → Carreira(s)** para as quais ela mais contribui — permitindo visualizar **todas** as trilhas de carreira possíveis ao mesmo tempo, e destacar uma trilha específica (ex.: "Desenvolvedor Full-Stack") sem perder a visão do mapa completo.

### Funcionalidades

- Grafo interativo com zoom, pan e layout hierárquico (Área → Disciplina → Carreira).
- Clique em qualquer nó para ver detalhes (descrição, carga horária, período, pré-requisitos, disciplinas/carreiras relacionadas).
- Seleção de carreira para destacar (ou isolar) sua trilha de disciplinas.
- Busca por nome de disciplina, área ou carreira.
- Legenda de cores/tipos de nó e das áreas do curso.
- Layout responsivo (desktop e celular).

## Base de dados: fidelidade ao PPC

Todos os dados (áreas, disciplinas, cargas horárias, períodos, pré-requisitos e carreiras) estão em [`data/mapa.json`](data/mapa.json) e foram extraídos do **PPC (Projeto Pedagógico de Curso)** oficial:

- Curso noturno, 8 semestres, carga horária total de 3.004h.
- 37 disciplinas obrigatórias distribuídas em 8 períodos + 4 vagas de optativa (Optativa I–IV) + 37 disciplinas do banco de optativas.
- 14 carreiras citadas explicitamente na seção "Perfil Profissional do Egresso" do PPC, mais um nó agregador (*Desenvolvedor Full-Stack*) que reúne as carreiras de Programador e Web Designer — marcado no próprio mapa como agrupamento sugerido, não um nome literal do documento.
- As **áreas** do mapa são um agrupamento temático mais granular, criado para fins didáticos, mantendo o campo `eixoPPC` em cada disciplina para rastrear a qual dos 6 eixos formais do PPC (Formação Matemática, Computacional, em TI, Administrativa, Complementar, Profissional e Social) ela pertence.

## Estrutura do projeto

```
├── index.html          # página principal
├── css/style.css        # estilos
├── js/main.js           # lógica do grafo (Cytoscape.js + dagre)
├── data/mapa.json        # dados do curso (áreas, disciplinas, carreiras, conexões)
└── README.md
```

## Stack técnica

Site 100% estático, sem backend e sem build step:

- [Cytoscape.js](https://js.cytoscape.org/) para renderização do grafo.
- [cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre) para o layout hierárquico.
- HTML/CSS/JavaScript puro para o restante da interface.

## Como rodar localmente

Basta servir a pasta com qualquer servidor HTTP estático (necessário por causa do `fetch` do `data/mapa.json`):

```bash
# Python
python -m http.server 8000

# ou Node
npx serve .
```

Depois acesse `http://localhost:8000`.

## Publicação (GitHub Pages)

O site é publicado a partir da branch `main`, pasta raiz (`/`), via GitHub Pages (Settings → Pages → Source: `main` / `/ (root)`).
