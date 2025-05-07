export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-[#23272a] p-8 rounded-lg shadow-lg w-full max-w-md text-white">
        <h1 className="text-2xl font-semibold mb-6 text-center">Welcome!</h1>
        <form>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Ex: User1"
              required=""
              className="w-full px-4 py-2 rounded-md bg-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7289da]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#7289da] hover:bg-[#5b6eae] text-white font-semibold rounded-md transition-colors duration-300"
          >
            Log In
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6" />
      </div>
    </div>
  );
}
