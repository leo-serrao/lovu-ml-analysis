# Contexto do Projeto: Ferramenta de Inteligência de Mercado (Mercado Livre — Nicho Pet Premium)

## Objetivo do negócio

Estamos (eu e minha esposa) planejando um e-commerce de nicho pet premium, começando por petiscos naturais para pets. O primeiro canal de venda será o Mercado Livre, com Instagram orgânico em paralelo. Antes de lançar os produtos, quero uma ferramenta interna que me ajude a validar demanda, mapear concorrência e acompanhar tendências dentro desse nicho específico — sem depender de ferramentas pagas genéricas do mercado.

## O que a ferramenta precisa fazer (MVP)

1. **Coleta periódica de dados** do Mercado Livre para termos/categorias do nicho pet (petiscos naturais, snacks pet, biscoitos pet, etc.)
2. **Séries históricas próprias** — a API do ML não entrega histórico de vendas/preço ao longo do tempo, só um snapshot atual. Preciso que a ferramenta rode periodicamente e guarde os snapshots no meu banco pra eu conseguir ver evolução.
3. **Painel simples** pra visualizar: concorrentes do nicho, faixa de preço, produtos em ascensão, termos de busca em alta.

## Contexto técnico (stack e preferências)

- Já trabalho com **React Native, Supabase, Turborepo/monorepo** em outros projetos (Adega Piloto, Pact) — prefiro manter consistência de stack quando fizer sentido.
- Este projeto pode ser um app novo separado, não precisa entrar em nenhum monorepo existente, a não ser que faça sentido técnico.
- Uso Supabase como banco/backend padrão (Postgres + Edge Functions para jobs periódicos).
- Sigo um workflow de skills próprias no Claude Code (separando planejamento de implementação, com artefatos de handoff persistentes tipo `.specs/` ou `PROJECT_CONTEXT.md`). Aplique esse mesmo padrão aqui: gerar primeiro um plano/spec do MVP antes de partir pra código.
- Código e comentários em inglês; comunicação/planejamento em português.

## Dados da API do Mercado Livre (já levantados)

- **Autenticação**: requer app registrado em developers.mercadolivre.com.br + OAuth (access token).
- **Endpoint `/trends`**: retorna os 50 produtos/termos mais buscados por categoria, atualizado semanalmente. Disponível para BR entre outros países. Permite filtrar por categoria.
- **Endpoint `/sites/$SITE_ID/search`**: busca de itens por palavra-chave ou categoria, retorna preço, `sold_quantity` (cumulativo, não é série temporal), frete, vendedor, etc.
- Não existe endpoint que devolva histórico de vendas por período — isso precisa ser construído por nós, salvando snapshots recorrentes.

## O que preciso que o planejamento do MVP responda

- Arquitetura mínima viável: onde roda o job de coleta (cron/Edge Function), onde fica o banco, como fica o painel (web simples? pode ser interno, sem necessidade de polish visual no MVP).
- Modelagem de dados: como estruturar snapshots de busca/preço/concorrência de forma que dê pra consultar evolução depois.
- Escopo do "V0" — o mínimo que já me dá valor pra validar o nicho de petiscos naturais, antes de expandir pra outras categorias pet.
- Riscos/limites da API (rate limits, necessidade de conta de vendedor ativa pra alguns endpoints, etc.) que possam afetar o design.
- Lista de decisões em aberto que precisam da minha validação antes de começar a implementação.

## Fora de escopo por enquanto

- Não é uma ferramenta pra revender/expor pra terceiros, é uso interno nosso.
- Não precisa suportar múltiplos países do Mercado Livre, só Brasil (MLB).
- Não precisa de autenticação de usuário/multi-tenant — uso é só nosso, dois usuários no máximo.
