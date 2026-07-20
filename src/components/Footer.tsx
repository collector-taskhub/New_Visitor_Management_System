export default function Footer() {
  return (
    <footer className="mt-auto bg-navy text-white/80">
      <div className="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="font-bold text-white marathi text-base mb-2">
            जिल्हाधिकारी कार्यालय, जालना
          </div>
          <p>Collector Office Compound, Jalna - 431203, Maharashtra, India</p>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">Quick Links</div>
          <ul className="space-y-1">
            <li><a href="/" className="hover:text-saffron-light">Visitor Registration</a></li>
            <li><a href="/track" className="hover:text-saffron-light">Track Application</a></li>
            <li><a href="/login" className="hover:text-saffron-light">Staff Login</a></li>
          </ul>
        </div>
        <div>
	<div className="font-semibold text-white mb-2">Office Hours</div>
	<p>Monday - Friday, 9:45 AM - 6:15 PM</p>
	<p>Saturday, Sunday & Public Holidays closed</p>
        </div>
      </div>
      <div className="tricolor-bar" />
      <div className="text-center text-xs py-3 text-white/60">
        © {new Date().getFullYear()} District Collector Office, Jalna — Government of Maharashtra
      </div>
    </footer>
  );
}
