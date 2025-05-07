import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("default"); // default, about, demo

  // Efek animasi saat komponen dimuat
  useEffect(() => {
    document.querySelector(".login-card").classList.add("animate-in");

    // Cek apakah user sudah login
    if (localStorage.getItem("name")) {
      navigate("/chat-page");
    }

    // Menampilkan efek typing pada placeholder
    const typingEffect = setTimeout(() => {
      const input = document.getElementById("username");
      if (input) {
        const placeholders = [
          "Masukkan username anda",
          "Contoh: JohnDoe",
          "Contoh: RizkyGaming",
          "Contoh: AmeliaKeren",
        ];
        let currentPlaceholder = 0;

        setInterval(() => {
          input.placeholder = placeholders[currentPlaceholder];
          currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
        }, 3000);
      }
    }, 1000);

    return () => {
      clearTimeout(typingEffect);
    };
  }, []);

  function login(e) {
    e.preventDefault();
    try {
      // Check if name is empty
      if (!name.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Username Diperlukan",
          text: "Silahkan masukkan username untuk melanjutkan",
          confirmButtonText: "Coba Lagi",
          confirmButtonColor: "#7289da",
          background: "#2a2d32",
          color: "#ffffff",
          iconColor: "#ffa502",
          showClass: {
            popup: "animate__animated animate__fadeInDown",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp",
          },
          customClass: {
            title: "text-xl font-bold",
            content: "text-gray-300",
          },
          backdrop: `
            rgba(33, 37, 41, 0.8)
          `,
          timer: 5000,
          timerProgressBar: true,
        });
        return; // Stop the function execution
      }

      // Simulasi loading
      setLoading(true);

      setTimeout(() => {
        localStorage.setItem("name", name);

        // Tampilkan welcome toast
        Swal.fire({
          icon: "success",
          title: `Selamat Datang, ${name}!`,
          text: "Anda akan diarahkan ke halaman chat",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          background: "#2a2d32",
          color: "#ffffff",
          iconColor: "#4ade80",
        });

        setTimeout(() => {
          navigate("/chat-page");
        }, 1500);
      }, 800);
    } catch (error) {
      setLoading(false);
      console.log("🚀 ~ login ~ error:", error);

      // Tampilkan pesan error
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: "Mohon coba beberapa saat lagi",
        confirmButtonText: "Tutup",
        confirmButtonColor: "#ef4444",
        background: "#2a2d32",
        color: "#ffffff",
      });
    }
  }

  // Fungsi untuk masuk sebagai demo user
  const loginAsDemo = () => {
    const demoNames = ["Demo_User", "Guest_123", "Tester_App", "Visitor_2025"];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    setName(randomName);

    setTimeout(() => {
      document.getElementById("login-form").requestSubmit();
    }, 300);
  };

  // Fungsi untuk menampilkan modal fitur
  const toggleModal = () => {
    setShowModal(!showModal);
  };

  // Mengubah mode tampilan
  const switchView = (mode) => {
    setViewMode(mode);
  };

  // Modal yang berisi informasi fitur
  const InfoModal = () => {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          showModal ? "visible opacity-100" : "invisible opacity-0"
        } transition-all duration-300`}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={toggleModal}
        ></div>
        <div className="relative bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-700 overflow-hidden transform transition-all duration-300 scale-100">
          {/* Header Modal */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-4 px-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Fitur ThisCord</h3>
            <button
              onClick={toggleModal}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          {/* Body Modal */}
          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    ></path>
                  </svg>
                  Global Chat
                </h4>
                <p className="text-gray-300">
                  Nikmati perpesanan instan dengan semua pengguna yang online
                  secara global. Kirim dan terima pesan secara real-time dengan
                  anggota grup dari seluruh dunia.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  Voice Call
                </h4>
                <p className="text-gray-300">
                  Hubungkan dengan anggota grup melalui panggilan suara. Fitur
                  ini memungkinkan komunikasi langsung tanpa harus mengetik,
                  menjadikan interaksi lebih personal dan cepat.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    ></path>
                  </svg>
                  AI Moderator
                </h4>
                <p className="text-gray-300">
                  Sistem moderasi konten otomatis berbasis AI yang memfilter
                  kata-kata tidak pantas dan menyensor konten bermasalah.
                  Memberikan peringatan kepada pengguna yang melanggar aturan,
                  menjaga lingkungan chat tetap sopan dan aman.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                  Upload Gambar
                </h4>
                <p className="text-gray-300">
                  Bagikan momen spesial dengan mengunggah gambar ke dalam
                  percakapan grup. Berbagi foto, meme, dan gambar lainnya untuk
                  komunikasi yang lebih ekspresif dan menyenangkan.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                  Grup Chat
                </h4>
                <p className="text-gray-300">
                  Bergabung dengan ruang chat grup untuk berkomunikasi dengan
                  banyak pengguna sekaligus. Fitur utama ThisCord yang
                  memungkinkan kolaborasi dan interaksi kelompok.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                  Login Sederhana
                </h4>
                <p className="text-gray-300">
                  Masuk dengan mudah hanya menggunakan username, tanpa proses
                  pendaftaran yang rumit. Mulai menggunakan ThisCord dalam
                  hitungan detik tanpa verifikasi email atau password yang
                  kompleks.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    ></path>
                  </svg>
                  Riwayat Pesan
                </h4>
                <p className="text-gray-300">
                  Akses riwayat pesan chat sebelumnya saat bergabung kembali.
                  Lihat percakapan yang terjadi selama Anda offline dan tidak
                  ketinggalan informasi penting.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-indigo-400 mb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    ></path>
                  </svg>
                  Notifikasi
                </h4>
                <p className="text-gray-300">
                  Dapatkan notifikasi visual saat ada pesan baru atau aktivitas
                  penting dalam chat, termasuk peringatan moderasi yang
                  diperlukan.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Modal */}
          <div className="bg-gray-800 border-t border-gray-700 py-3 px-6 flex justify-end">
            <button
              onClick={toggleModal}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg transition-all duration-300 hover:from-indigo-600 hover:to-purple-600"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Tampilan "About" untuk halaman login
  const AboutView = () => {
    return (
      <div className="space-y-4 animate-fadeIn">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Tentang ThisCord
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          ThisCord adalah platform komunikasi grup chat modern yang dirancang
          untuk menghubungkan pengguna dari seluruh dunia. Dibangun dengan
          teknologi terkini seperti React, Socket.IO, dan integrasi AI, ThisCord
          menawarkan pengalaman chatting yang mulus, aman, dan menyenangkan.
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          Dikembangkan dengan fokus pada kemudahan penggunaan dan keamanan,
          ThisCord menghadirkan fitur-fitur unggulan seperti Global Chat, Voice
          Call, moderasi konten berbasis AI, dan kemampuan berbagi gambar.
          Bergabunglah dengan komunitas ThisCord dan nikmati komunikasi tanpa
          batas!
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center text-gray-400 text-xs">
            <svg
              className="w-4 h-4 mr-2 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>
              Global Chat untuk komunikasi dengan pengguna di seluruh dunia
            </span>
          </div>
          <div className="flex items-center text-gray-400 text-xs">
            <svg
              className="w-4 h-4 mr-2 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>
              Sistem moderasi AI untuk menjaga percakapan tetap aman dan sopan
            </span>
          </div>
          <div className="flex items-center text-gray-400 text-xs">
            <svg
              className="w-4 h-4 mr-2 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>
              Voice Call dan berbagi gambar untuk komunikasi yang lebih
              ekspresif
            </span>
          </div>
        </div>
        <div className="pt-4">
          <button
            onClick={() => switchView("default")}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all duration-300 text-sm"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-sans relative overflow-hidden">
      {/* Efek partikel background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 1}px`,
              height: `${Math.random() * 6 + 1}px`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Efek lingkaran dekoratif */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-40 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-2xl animate-pulse-slow delay-2000"></div>

        {/* Logo aplikasi */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          <button
            onClick={() => switchView("default")}
            className={`px-3 py-1 text-xs rounded-t-lg transition-all ${
              viewMode === "default"
                ? "bg-gray-800/80 text-indigo-400 border-t border-l border-r border-gray-700"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-800/70"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchView("about")}
            className={`px-3 py-1 text-xs rounded-t-lg transition-all ${
              viewMode === "about"
                ? "bg-gray-800/80 text-indigo-400 border-t border-l border-r border-gray-700"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-800/70"
            }`}
          >
            About
          </button>
        </div>

        {/* Info Button */}
        <button
          onClick={toggleModal}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-20 shadow-lg"
          title="Informasi Fitur"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </button>

        {/* Card */}
        <div className="login-card relative bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700 z-10 transform transition-all opacity-0 scale-95 translate-y-4">
          {viewMode === "default" ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  Selamat Datang!
                </h1>
                <p className="text-gray-400 text-sm">
                  Masukkan username untuk memulai percakapan
                </p>
              </div>

              <form id="login-form" onSubmit={login} className="space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                    </span>
                    <input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                      }}
                      type="text"
                      id="username"
                      placeholder="Masukkan username anda"
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 rounded-lg text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 flex items-center justify-center ${
                    loading ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center">
                <div className="border-t border-gray-700 flex-grow mr-3"></div>
                <span className="text-xs text-gray-500">atau</span>
                <div className="border-t border-gray-700 flex-grow ml-3"></div>
              </div>

              <div className="mt-4">
                <button
                  onClick={loginAsDemo}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-all duration-300 text-sm flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Masuk sebagai pengguna demo
                </button>
              </div>
            </>
          ) : viewMode === "about" ? (
            <AboutView />
          ) : null}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} ThisCord. Semua hak dilindungi.
            </p>
          </div>

          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <span className="block w-1 h-1 rounded-full bg-gray-500"></span>
            <span className="block w-1 h-1 rounded-full bg-gray-500"></span>
            <span className="block w-1 h-1 rounded-full bg-gray-500"></span>
          </div>
        </div>
      </div>

      {/* Modal Info Fitur */}
      <InfoModal />

      {/* Custom Scrollbar Style dan Animasi */}
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 32, 36, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(114, 137, 218, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(114, 137, 218, 0.8);
        }

        .animate-in {
          animation: cardIn 0.6s ease forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease forwards;
        }

        .animate-pulse-slow {
          animation: pulseSlow 6s infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-2000 {
          animation-delay: 2s;
        }

        @keyframes cardIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes pulseSlow {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
