const Footer = () => {
  return (
    <>
      <footer className="footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4 fixed bottom-0">
        <aside>
          <p>Made with ❤️ in {new Date().getFullYear()} by Arsh Shaikh.</p>
        </aside>
      </footer>
    </>
  );
};

export default Footer;
