// Minimal Edu OS public footer used by content pages.
export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-gray-500">
        <span className="font-semibold text-navy-700">Edu OS</span> · AI-Native Learning · ©{' '}
        {new Date().getFullYear()} Tian Jun Education Group
      </div>
    </footer>
  );
}
