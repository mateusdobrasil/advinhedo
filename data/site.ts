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

// Linha do tempo da história da igreja
export const historia = [
  {
    ano: "1940",
    titulo: "O Início",
    subtitulo: "Início da jornada missionária de Joaquim Ribeiro em Rocinha, levando o evangelho aos quilombolas.",
    imagem: "/imgs/historia-1940.jpg",
    texto: "Foi por volta da década de 1940 que um homem muito simples, sem muito estudo e com uma caixa de pintinhos, embarcava na estação de trens da Antiga Companhia Paulista em direção a Rocinha. Seu objetivo era levar o evangelho do Senhor Jesus aos quilombolas da Fazenda Cachoeira. Mas o que tem a ver a caixa com pintinhos? A oportunidade de falar de Jesus às almas que iriam embarcar naquele trem. O nome deste ilustre homem era Joaquim Ribeiro, um cooperador da Igreja em Jundiaí que fazia este trajeto para ganhar seu sustento e ganhar almas para o Senhor Jesus. Uma pessoa desprendida de tudo, conta a nossa irmã Dirce Pinheiro, que teve a oportunidade de conhecer o nobre cooperador, que ao chegar em uma vila e observar que alguém estava com fome, ele dava a marmita que tinha para suprir a fome daquele necessitado. A primeira família a ser evangelizada pelo irmão Joaquim foi a família do irmão João Manuel da Silva (In memorian), e ele recebia o irmão Joaquim em sua humilde casa para realizar cultos na Fazenda Cachoeira e ganhar outras almas para o Senhor Jesus.",
  },
  {
    ano: "1950",
    titulo: "Crescimento e Desafios",
    subtitulo: "Expansão da obra religiosa para Vinhedo, enfrentando desafios para construir o primeiro templo.",
    imagem: "/imgs/historia-1950.jpg",
    texto: "Com a emancipação de Rocinha para Vinhedo, e consequentemente o crescimento, o Irmão Joaquim contou com a ajuda de outro cooperador, o Pastor Ariano Ferreira, conhecido do Pastor Elizeu Queiroz de Jundiaí, para iniciar os trabalhos nas casas dos irmãos pelo Bairro da Barra Funda, Jardim Brasil e Nova Vinhedo. O Pastor Ariano ficou pouco tempo e o Pastor Norestildes Falcão e sua Família deram início aos trabalhos na rua da Formiga, no Jardim Brasil e com a ajuda dos irmãos que se ajuntavam ao evangelho decidiram comprar um lote para construir o primeiro templo na década de 1950.",
  },
  {
    ano: "1960",
    titulo: "Expansão para Outras Regiões",
    subtitulo: "Ampliação da evangelização para fazendas e bairros, superando dificuldades com apoio de novos cooperadores.",
    imagem: "/imgs/historia-1960.jpg",
    texto: "Muitos desafios foram superados, com a vinda de muitos outros cooperadores para ajudar na obra do Senhor, como o Maestro Paulo Ferreira, filho do Pastor Ariano Ferreira, para ajudar com a música e o coral da Igreja. Muitos outros já passaram por esta obra, na Fazenda Monte Alegre, Fazenda Bahia, Fazenda Santa Cândida e o Bairro da Capela, foram desbravados pelo poder do evangelho na década de 1960. Nada pode parar o crescimento da Igreja, disse o Pastor Alberto Nicácio, que apenas um irmão tinha carro na igreja, e disponibilizava para ajudar na evangelização dessa região, era o saudoso José Bertaglia. Saíam do centro em direção às referidas fazendas e ao bairro da Capela para evangelizar com Willys Itamaty, colocava os irmãos no carro e saíam para o evangelismo.",
  },
  {
    ano: "1970",
    titulo: "Novos Desafios e Mudanças",
    subtitulo: "Necessidade de um novo templo devido ao crescimento da congregação, resultando na troca por um terreno maior em 1978.",
    imagem: "/imgs/historia-1970.jpg",
    texto: "Agora um desafio novo, um templo maior em um lugar onde a força da natureza não fosse um problema. Toda vez que chovia a Igreja ficava alagada. Em 1978, não comportando mais o número de membros que estava em franco crescimento, o Pastor Norestildes de Góis Leite Falcão propôs à prefeitura da cidade a permuta do prédio da igreja por um terreno muito maior no Jardim Alba.",
  },
  {
    ano: "1980",
    titulo: "Inauguração do Novo Templo",
    subtitulo: "Celebração da inauguração do novo templo em 1980, marcando um marco na história da igreja.",
    imagem: "/imgs/historia-1980.jpg",
    texto: "A inauguração do novo templo aconteceu no dia 02 de Abril de 1980, com a presença de várias autoridades.",
  },
  {
    ano: "1993",
    titulo: "Autonomia da Igreja",
    subtitulo: "Conquista da autonomia da igreja em 1993, tornando-se uma congregação independente.",
    imagem: "/imgs/historia-1993.jpg",
    texto: "Em 1993 a igreja ganhou autonomia, e tornou-se campo independente, pois até então era congregação da Igreja Evangélica Assembleia de Deus – Vianelo – Jundiaí.",
  },
  {
    ano: "1997",
    titulo: "Continuidade e Crescimento",
    subtitulo: "Continuidade da liderança pastoral com o Pastor Sílvio Donizete Pereira e crescimento da igreja com múltiplas congregações.",
    imagem: "/imgs/historia-1997.jpg",
    texto: "Após a presidência do Pastor Angelo Francisco dos Santos, assumiu o Pastor Sílvio Donizete Pereira. Desde a sua fundação, nos anos 40, a igreja vem expandindo.",
  },
  {
    ano: "2025",
    titulo: "Novos Desafios e Oportunidades",
    subtitulo: "O pastor Heber Souza, vindo de São Paulo, assume com o desafio de liderar a igreja em um novo ciclo de crescimento.",
    imagem: "/imgs/historia-2025.jpg",
    texto: "A igreja ganha uma nova fase de expansão, agora com a sede e mais 7 congregações espalhadas pela cidade, a igreja segue trabalhando com a liderança e visão ministerial do pastor Heber Souza.",
  },
];