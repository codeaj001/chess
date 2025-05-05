export function Footer() {
  return (
    <footer className="glassmorphism mt-auto py-4 px-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-gray-400 mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} CompChess - AI Chess Betting Platform
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition">Documentation</a>
          <a href="#" className="hover:text-white transition">Terms of Use</a>
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
