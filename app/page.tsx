import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      
      {/* HEADER / NAVBAR PUBLICA */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🏛️</span>
            <div>
              <h1 className="font-black text-lg sm:text-xl text-blue-800 tracking-tight leading-none">IBV</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Escola Teológica</p>
            </div>
          </div>
          
          {/* 👇 Área dos Botões Corrigida e Responsiva 👇 */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/cadastro" 
              className="text-blue-600 font-bold hover:text-blue-800 transition text-xs sm:text-sm whitespace-nowrap"
            >
              Criar Conta
            </Link>
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold hover:bg-blue-700 transition shadow-sm text-xs sm:text-sm whitespace-nowrap"
            >
              Área do Aluno
            </Link>
          </div>
          {/* 👆 Fim da Área dos Botões 👆 */}
          
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-blue-900 to-indigo-900 text-white py-20 sm:py-24 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Instituto Bíblico de Vinhedo
            </h2>
            <p className="text-lg md:text-xl text-blue-100 font-light mb-10 max-w-2xl mx-auto italic leading-relaxed">
              "Com o propósito de aperfeiçoar os santos para a obra do ministério, para que o Corpo de Cristo seja edificado."<br/>
              <span className="font-bold text-blue-300 mt-2 block">— Efésios 4:12</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#cursos" className="bg-white text-blue-900 px-8 py-3.5 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
                Conhecer os Cursos
              </a>
            </div>
          </div>
        </section>

        {/* SOBRE O IBV & OBJETIVOS */}
        <section className="py-16 sm:py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div>
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Nossa História</h3>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">14 Anos Formando Vidas na Palavra</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                O IBV nasceu no coração de Deus em Vinhedo. Ao longo de 14 anos, o Senhor tem abençoado este trabalho, trazendo alunos e professores dedicados a aprender e a se aprofundar no conhecimento da Palavra.
              </p>
              <p className="text-gray-600 leading-relaxed italic border-l-4 border-blue-200 pl-4">
                "Ensine-as com persistência a seus filhos. Converse sobre elas quando estiver sentado em casa, quando estiver andando pelo caminho..." (Dt 6:5-9)
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="text-3xl mb-3">📖</div>
                <h4 className="font-bold text-gray-800 mb-2">Escrituras</h4>
                <p className="text-sm text-gray-500">Educação cristã baseada inteiramente no conhecimento bíblico.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="text-3xl mb-3">🌱</div>
                <h4 className="font-bold text-gray-800 mb-2">Caráter</h4>
                <p className="text-sm text-gray-500">Desenvolvimento contínuo do caráter cristão.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="text-3xl mb-3">🛡️</div>
                <h4 className="font-bold text-gray-800 mb-2">Ministério</h4>
                <p className="text-sm text-gray-500">Preparação sólida para o exercício ministerial.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="text-3xl mb-3">👑</div>
                <h4 className="font-bold text-gray-800 mb-2">Liderança</h4>
                <p className="text-sm text-gray-500">Formação de líderes para edificar a Igreja de Cristo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CURSOS */}
        <section id="cursos" className="py-16 sm:py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Formação Teológica</h3>
              <h2 className="text-3xl font-bold text-gray-800">Conheça Nossos Cursos (2026)</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* Curso Básico */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-lg transition group">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Nível Discipulado</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">Básico em Teologia</h3>
                <p className="text-gray-500 text-sm mb-6 lg:h-16">Destinado a novos convertidos ou irmãos que queiram iniciar os estudos teológicos.</p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">⏳</span> Duração: 1 ano (8 módulos)</div>
                  <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">📅</span> Início: Março 2027</div>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-sm text-gray-500 uppercase font-bold">Mensalidade</p>
                  <p className="text-3xl font-black text-gray-800">R$ 120<span className="text-lg font-medium text-gray-400">/mês</span></p>
                </div>
              </div>

              {/* Curso Médio */}
              <div className="bg-blue-900 p-8 rounded-3xl shadow-xl transform lg:-translate-y-4 relative mt-4 lg:mt-0">
                <div className="absolute top-0 right-8 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-b-lg uppercase tracking-wider">Mais Procurado</div>
                <span className="bg-blue-800 text-blue-200 border border-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block mt-4 lg:mt-0">Intermediário</span>
                <h3 className="text-2xl font-bold text-white mb-2">Médio em Teologia</h3>
                <p className="text-blue-200 text-sm mb-6 lg:h-16">Para quem busca um aprofundamento sólido nas doutrinas e história da Igreja.</p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-blue-100"><span className="text-lg">⏳</span> Duração: 2 anos (18 módulos)</div>
                  <div className="flex items-center gap-3 text-sm text-blue-100"><span className="text-lg">📅</span> Início: Imediato</div>
                </div>
                <div className="border-t border-blue-800 pt-6">
                  <p className="text-sm text-blue-300 uppercase font-bold">Mensalidade</p>
                  <p className="text-3xl font-black text-white">R$ 150<span className="text-lg font-medium text-blue-400">/mês</span></p>
                </div>
              </div>

              {/* Curso Avançado */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-lg transition group mt-4 lg:mt-0">
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Aprofundamento</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition">Avançado em Teologia</h3>
                <p className="text-gray-500 text-sm mb-6 lg:h-16">Para líderes, professores e alunos que buscam a excelência no conhecimento bíblico.</p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">⏳</span> Duração: 2 anos (18 módulos)</div>
                  <div className="flex items-center gap-3 text-sm text-gray-600"><span className="text-lg">📅</span> Início: Imediato</div>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-sm text-gray-500 uppercase font-bold">Mensalidade</p>
                  <p className="text-3xl font-black text-gray-800">R$ 150<span className="text-lg font-medium text-gray-400">/mês</span></p>
                </div>
              </div>

            </div>

            {/* Cursos Especiais (CFO e Português) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:text-left">
                <div className="bg-blue-50 p-4 rounded-full text-3xl shrink-0">🔥</div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">CFO - Formação de Obreiro</h4>
                  <p className="text-sm text-gray-500 mt-1">Turmas presenciais e 100% virtuais. Segundas-feiras, 19:30h às 22:00h.</p>
                  <p className="text-sm font-bold text-blue-600 mt-2">Mensalidade: R$ 120 | Início: Março/2026</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:text-left">
                <div className="bg-yellow-50 p-4 rounded-full text-3xl shrink-0">📝</div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Português Instrumental</h4>
                  <p className="text-sm text-gray-500 mt-1">Duração de 8 meses. Quintas-feiras, 19:30h às 22:00h. Matrículas abertas!</p>
                  <p className="text-sm font-bold text-yellow-600 mt-2">Envie um e-mail para reservar sua vaga.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 text-center text-sm">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-center items-center gap-2 text-white">
            <span className="text-2xl">🏛️</span>
            <span className="font-black text-xl tracking-tight">IBV</span>
          </div>
          <p className="mb-2">📍 Sede: Vinhedo, SP</p>
          <p className="mb-6">✉️ ibv.vinhedo@gmail.com</p>
          <div className="border-t border-gray-800 pt-8 mt-8">
            <p>© {new Date().getFullYear()} Instituto Bíblico de Vinhedo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}