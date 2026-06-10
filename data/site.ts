// =============================================================
// DADOS DA IGREJA — edite tudo por aqui em um só lugar.
// =============================================================

export const igreja = {
  nome: "AD Vinhedo",
  nomeCompleto: "Assembleia de Deus em Vinhedo",
  cidade: "Vinhedo - SP",
  fundacao: "1940",
  email: "contato@advinhedo.org",
  endereco: {
    linha1: "R. Antonio Von Zuben, 171",
    cep: "13289-034",
    bairro: "Jardim Alba",
    cidade: "Vinhedo - SP",
  },
  // Link de incorporação do Google Maps (Compartilhar > Incorporar um mapa > copiar o src do iframe)
  mapaEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.801087881607!2d-46.98437412381711!3d-23.03107457916781!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cf32a0b6cfa535%3A0x422e90d3240d09f1!2sIgreja%20Evang%C3%A9lica%20Assembl%C3%A9ia%20de%20Deus!5e0!3m2!1spt-BR!2sbr",
  redes: {
    instagram: "https://instagram.com/advinhedo",
  },
  // Link da plataforma de cadastro/contribuição
  linkCadastro: "/aplicacao/cadastro",
  linkContribuir: "#contribuir",
};

// Itens do menu principal
export const navegacao = [
  { label: "Início", href: "/" },
  { label: "A Igreja", href: "/igreja" },
  { label: "Como chegar", href: "/como-chegar" },
  { label: "Eventos", href: "/eventos" },
  { label: "Contato", href: "/contato" },
];

// Aplicações internas (dropdown "Aplicações" do header)
export const aplicacoes = [
  { label: "Cadastro", href: "/aplicacao/cadastro" },
  { label: "Educacional", href: "/aplicacao/login" },
  { label: "Recepção", href: "/aplicacao/recepcao" },
  { label: "Obreiros", href: "/aplicacao/reunioes" },
];

// Pilares / valores
export const pilares = [
  {
    titulo: "Palavra",
    texto:
      "Cremos que a Bíblia Sagrada é a Palavra de Deus e o fundamento firme sobre o qual edificamos a nossa fé e a nossa vida.",
  },
  {
    titulo: "Oração",
    texto:
      "Buscamos a Deus em oração, juntos e individualmente, confiando que Ele ouve, sustenta e direciona cada passo da nossa caminhada.",
  },
  {
    titulo: "Adoração",
    texto:
      "Celebramos a fé em Cristo Jesus com gratidão, oferecendo louvor e glória a Deus em cada culto e em cada dia.",
  },
];

// Programação semanal
export const programacao = [
  {
    dia: "Domingo",
    cultos: [
      { hora: "09h00", nome: "Escola Dominical" },
      { hora: "10h15", nome: "Culto da Família" },
      { hora: "18h30", nome: "Culto de Louvor e Palavra" },
    ],
  },
  {
    dia: "Sexta-feira",
    cultos: [{ hora: "19h30", nome: "Culto de Ensino" }],
  },
  {
    dia: "1º domingo do mês",
    cultos: [{ hora: "10h15", nome: "Santa Ceia" }],
  },
];

// Próximos eventos especiais — edite ou apague conforme a agenda
export const eventos = [
  {
    titulo: "Santa Ceia do Senhor",
    data: "Todo 1º domingo do mês",
    horario: "10h15",
    descricao:
      "Momento de comunhão em que a igreja se reúne para participar da Ceia, lembrando do sacrifício de Cristo.",
  },
  {
    titulo: "Culto de Ensino",
    data: "Todas as sextas-feiras",
    horario: "19h30",
    descricao:
      "Uma noite dedicada ao estudo aprofundado da Palavra, fortalecendo a fé e o conhecimento da igreja.",
  },
  {
    titulo: "Escola Dominical",
    data: "Todos os domingos",
    horario: "09h00",
    descricao:
      "Classes para todas as idades, com ensino bíblico organizado para crianças, jovens e adultos.",
  },
];

// =============================================================
// CONTEÚDO EDITÁVEL pelo painel /admin (textos e imagens da home)
// Serve como conteúdo padrão (fallback) caso o banco esteja vazio.
// =============================================================

export const conteudo = {
  imagens: {
    heroTemplo: "/imgs/templo.jpg",
    sobreTemplo: "/imgs/templo.jpg",
    pastor: "/imgs/pastor.jpg",
  },
  hero: {
    subtitulo:
      "Somos uma igreja dedicada a anunciar o evangelho de Jesus Cristo, fundamentados nas verdades da Bíblia Sagrada. Venha nos visitar — há um lugar para você.",
  },
  sobre: {
    paragrafo1:
      "Desde 1940 semeamos o evangelho com alegria na cidade de Vinhedo - SP. Nosso fundamento é a Palavra de Deus: sobre ela nos firmamos e cremos em suas promessas.",
    paragrafo2:
      "Ao longo de décadas, Deus tem sustentado esta igreja e formado uma família de fé comprometida com a oração, com o ensino da Bíblia e com o cuidado mútuo.",
  },
  pastor: {
    nome: "Nome do Pastor",
    bio1: "Apresente aqui a trajetória do pastor: sua história de fé e sua família.",
    bio2: "Um segundo parágrafo sobre o chamado ministerial e os valores da liderança.",
  },
};