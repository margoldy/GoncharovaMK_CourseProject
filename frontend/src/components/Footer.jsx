function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {currentYear} Семейный бюджет. Учёт доходов и расходов вашей семьи</p>
      </div>
    </footer>
  );
}

export default Footer;