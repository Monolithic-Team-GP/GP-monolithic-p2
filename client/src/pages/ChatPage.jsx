export default function ChatPage() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Chat Bubble - Discord Style</title>
      {/* Sidebar */}
      <aside className="w-64 bg-[#23272a] p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Channel</h2>
        <nav className="flex flex-col space-y-2">
          <a href="#" className="px-3 py-2 rounded hover:bg-[#2c2f33]">
            # umum
          </a>
          <a href="#" className="px-3 py-2 rounded hover:bg-[#2c2f33]">
            # proyek
          </a>
          <a href="#" className="px-3 py-2 rounded hover:bg-[#2c2f33]">
            # santai
          </a>
        </nav>
      </aside>
      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 bg-[#2c2f33] border-b border-[#202225]">
          <h1 className="text-2xl font-semibold"># umum</h1>
        </header>
        {/* Messages Area */}
        <section className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#36393f]">
          {/* Incoming Message */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
            <div className="bg-[#40444b] p-3 rounded-lg max-w-md">
              <p className="text-sm font-semibold">pengguna1</p>
              <p className="text-sm text-gray-200">Halo semua, selamat pagi!</p>
            </div>
          </div>
          {/* Outgoing Message */}
          <div className="flex justify-end">
            <div className="bg-[#7289da] p-3 rounded-lg max-w-md text-white">
              <p className="text-sm font-semibold">kamu</p>
              <p className="text-sm">Pagi juga! Apa kabar?</p>
            </div>
          </div>
          {/* Incoming Message */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
            <div className="bg-[#40444b] p-3 rounded-lg max-w-md">
              <p className="text-sm font-semibold">pengguna2</p>
              <p className="text-sm text-gray-200">
                Baik, kita lanjut diskusinya di sini ya.
              </p>
            </div>
          </div>
        </section>
        {/* Chat Input */}
        {/* Chat Input */}
        <footer className="bg-[#40444b] p-4">
          <form className="flex items-center gap-2" onsubmit="return false;">
            {/* Upload Button */}
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex items-center justify-center w-10 h-10 bg-[#2f3136] hover:bg-[#36393f] text-gray-300 rounded-md transition"
            >
              📎
            </label>
            <input id="file-upload" type="file" className="hidden" />
            {/* Text Input */}
            <input
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 px-4 py-2 rounded-md bg-[#2f3136] text-white focus:outline-none focus:ring-2 focus:ring-[#7289da]"
            />
            {/* Send Button */}
            <button
              type="submit"
              className="px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white font-semibold rounded-md"
            >
              Kirim
            </button>
          </form>
        </footer>
      </main>
    </>
  );
}
