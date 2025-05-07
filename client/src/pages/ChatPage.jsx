export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#36393f] text-white">
      {/* Sidebar: User List */}
      <aside className="w-64 bg-[#23272a] p-4 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Pengguna Online</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500 rounded-full" />
            <span className="text-sm">pengguna1</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full" />
            <span className="text-sm">pengguna2</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full" />
            <span className="text-sm">pengguna3</span>
          </li>
          {/* Tambahkan lebih banyak user di sini */}
        </ul>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 bg-[#2c2f33] border-b border-[#202225] flex items-center justify-between shadow-md">
          <h1 className="text-2xl font-semibold">Grup Chat</h1>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#7289da] hover:bg-[#5b6eae] text-white rounded-md font-medium transition"
            onClick={() => alert("Voice call diaktifkan! (simulasi)")}
          >
            🎤 Voice Call
          </button>
        </header>

        {/* Messages Area */}
        <section className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#36393f] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat">
          {/* Incoming Message */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
            <div className="bg-[#40444b] p-3 rounded-lg max-w-md">
              <p className="text-sm font-semibold">pengguna1</p>
              <p className="text-sm text-gray-200">Halo semua!</p>
            </div>
          </div>

          {/* Outgoing Message */}
          <div className="flex justify-end">
            <div className="bg-[#7289da] p-3 rounded-lg max-w-md text-white">
              <p className="text-sm font-semibold">kamu</p>
              <p className="text-sm">Hai! Selamat datang.</p>
            </div>
          </div>
        </section>

        {/* Chat Input */}
        <footer className="bg-[#40444b] p-4 shadow-inner">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
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
    </div>
  );
}
