"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fallbackProducts, sortProducts, type Product } from "../lib/content";

const WHATSAPP_NUMBER = "918590160018";

const whatsappHref = (product?: Product) => {
  const message = product
    ? `Hello Aaradhya, I would like to enquire about ${product.name} (${product.id}) - ${product.subtitle}. Please share availability, price and sizing details.`
    : "Hello Aaradhya, I would love to know more about your collections.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export default function AaradhyaSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState(sortProducts(fallbackProducts));
  const [category, setCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openProduct = useCallback((product: Product) => {
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedProduct(product);
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
    window.requestAnimationFrame(() => lastFocusedRef.current?.focus());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/content", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length) setProducts(sortProducts(data.products));
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen || Boolean(selectedProduct));
    return () => document.body.classList.remove("no-scroll");
  }, [menuOpen, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProduct();
      if (event.key !== "Tab" || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const focusFrame = window.requestAnimationFrame(() => first?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKey);
    };
  }, [closeProduct, selectedProduct]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const visibleProducts = category === "All" ? products : products.filter((product) => product.category === category);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div aria-hidden={selectedProduct ? true : undefined}>
        <div className="announcement">
          <span>Complimentary personal styling via WhatsApp</span>
          <strong>Aaradhya — Where elegance becomes an identity</strong>
          <span>India · Est. 2026</span>
        </div>

      <header className="site-header">
        <a className="brand-link" href="#top" aria-label="Aaradhya home" onClick={closeMenu}>
          <img src="/brand/aaradhya-logo.svg" alt="Aaradhya women's clothing brand" />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#collection">The collection</a>
          <a href="#story">Our story</a>
          <a href="#world">World of Aaradhya</a>
        </nav>
        <div className="header-actions">
          <a className="header-enquire" href={whatsappHref()} target="_blank" rel="noreferrer">
            Enquire <span aria-hidden="true">↗</span>
          </a>
          <button
            className={`menu-button ${menuOpen ? "is-open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">
          <a href="#collection" onClick={closeMenu}><span>01</span> Collection</a>
          <a href="#story" onClick={closeMenu}><span>02</span> Our story</a>
          <a href="#world" onClick={closeMenu}><span>03</span> World of Aaradhya</a>
          <a href="#contact" onClick={closeMenu}><span>04</span> Contact</a>
        </nav>
        <p>Timeless Indian clothing, made to be lived in.</p>
      </div>

      <div className="page-content" aria-hidden={menuOpen ? true : undefined}>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-media">
          <img src="/campaign/hero.webp" alt="Woman in an ivory saree with an aubergine border in a quiet courtyard" />
          <div className="hero-caption">
            <span>Look 01</span>
            <span>Ivory / Aubergine</span>
          </div>
        </div>
        <div className="hero-copy">
          <img className="hero-watermark" src="/brand/aaradhya-stamp.svg" alt="" aria-hidden="true" />
          <p className="eyebrow">Rhythm of Grace · 2026</p>
          <h1 id="hero-title">Tradition,<br /><em>in her own rhythm.</em></h1>
          <div className="hero-foot">
            <p className="hero-intro">
              Clothing that carries grace lightly — shaped by Indian heritage, made for the woman becoming entirely her own.
            </p>
            <a className="hero-button" href="#collection">Discover the collection <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <span className="hero-note">Aaradhya / Rhythm of Grace / 2026</span>
      </section>

      <section className="manifesto" aria-label="Brand statement">
        <div className="manifesto-inner">
          <div className="manifesto-meta"><span>01 / Our point of view</span><span>Aaradhya · 2026</span></div>
          <p className="eyebrow">A celebration of womanhood</p>
          <h2><span>Admired, never defined.</span><em>Graceful, never still.</em></h2>
          <div className="manifesto-foot">
            <p>
              Aaradhya blends the soul of Indian dressing with the quiet confidence of the modern woman — pieces designed to feel personal from the very first wear.
            </p>
            <div className="manifesto-signature" aria-hidden="true"><strong>Aaradhya</strong><small>Admiration · Devotion · Grace</small></div>
          </div>
        </div>
      </section>

      <section className="collection-section" id="collection" aria-labelledby="collection-title">
        <div className="section-heading">
          <div className="section-title-block">
            <span className="section-number">02</span>
            <div>
              <p className="eyebrow">Rhythm of Grace</p>
              <h2 id="collection-title">Objects of <em>admiration</em></h2>
            </div>
          </div>
          <p>A considered wardrobe of sarees, fluid sets and occasion silhouettes in Aaradhya’s signature tones.</p>
        </div>

        <div className="filters" aria-label="Filter collection">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "is-active" : ""}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <article className="product-card" key={product.id} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
              <button className="product-image" type="button" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}>
                <img src={product.image} alt={product.imageAlt} loading="eager" />
                <span>View look <b aria-hidden="true">↗</b></span>
              </button>
              <div className="product-meta">
                <div>
                  <p>{product.category} · {product.id}</p>
                  <h3>{product.name}</h3>
                  <span>{product.subtitle}</span>
                  <small>{product.fabric}</small>
                </div>
                <button type="button" onClick={() => openProduct(product)} aria-label={`Enquire about ${product.name}`}>
                  <span className="plus-glyph" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="pattern-ribbon" aria-hidden="true">
        <div className="pattern-track">
          {[0, 1].map((group) => (
            <div className="pattern-group" key={group}>
              {Array.from({ length: 6 }, (_, item) => (
                <span key={item}>Aaradhya · Grace in every line ·</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="story-section" id="story" aria-labelledby="story-title">
        <div className="story-mark">
          <img src="/brand/aaradhya-stamp.svg" alt="Aaradhya brand stamp" />
        </div>
        <div className="story-copy">
          <p className="eyebrow">The name / The meaning</p>
          <h2 id="story-title">Born from <em>admiration.</em></h2>
          <p className="story-lead">
            Aaradhya represents admiration, devotion, beauty and grace. It began with a simple belief: every woman deserves clothing that makes her feel confident, beautiful and entirely herself.
          </p>
          <div className="story-columns">
            <p>Our mark brings together the letter “A” and the silhouette of a woman. Its flowing curves recall the drape of a saree; its wing-like form speaks of freedom, dreams and empowerment.</p>
            <p>The deep purple is our signature — a colour of creativity, royalty and quiet sophistication. Together, these elements hold the balance we seek: heritage with movement, softness with strength.</p>
          </div>
        </div>
      </section>

      <section className="values-section" id="world" aria-labelledby="values-title">
        <div className="values-intro">
          <p className="eyebrow">The Aaradhya way</p>
          <h2 id="values-title">Made for the life<br /><em>inside the garment.</em></h2>
        </div>
        <div className="values-list">
          <article><span>01</span><h3>Timeless by intent</h3><p>Silhouettes that outlive a season and become part of your own visual language.</p></article>
          <article><span>02</span><h3>Ease in every line</h3><p>Movement, softness and considered details that feel as beautiful as they look.</p></article>
          <article><span>03</span><h3>Tradition in motion</h3><p>Indian dressing reimagined with clarity — never costume, always alive.</p></article>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <img className="contact-pattern" src="/brand/aaradhya-pattern.webp" alt="" aria-hidden="true" />
        <div className="contact-inner">
          <p className="eyebrow">Private enquiries</p>
          <h2 id="contact-title">Found something<br /><em>that feels like you?</em></h2>
          <p>Begin a conversation on WhatsApp. We’ll help with availability, sizing, fabric details and your perfect Aaradhya piece.</p>
          <a className="primary-button" href={whatsappHref()} target="_blank" rel="noreferrer">
            Enquire on WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <a className="phone-link" href="tel:+918590160018">+91 85901 60018</a>
        </div>
      </section>

      <footer>
        <img src="/brand/aaradhya-logo.svg" alt="Aaradhya" />
        <p>Women’s clothing · India</p>
        <div><a href="#top">Back to top ↑</a><span>© 2026 Aaradhya</span></div>
      </footer>

      <a className="floating-whatsapp" href={whatsappHref()} target="_blank" rel="noreferrer" aria-label="Chat with Aaradhya on WhatsApp">
        <span>WA</span><b>Enquire</b><i aria-hidden="true"><span className="cta-arrow-glyph" /></i>
      </a>
      </div>
      </div>

      {selectedProduct && (
        <div className="product-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeProduct();
        }}>
          <div className="product-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabIndex={-1}>
            <button className="dialog-close" type="button" onClick={closeProduct} aria-label="Close product details">
              <span className="close-glyph" aria-hidden="true" />
            </button>
            <div className="dialog-image"><img src={selectedProduct.image} alt={selectedProduct.imageAlt} /></div>
            <div className="dialog-copy">
              <p className="eyebrow">{selectedProduct.category} · {selectedProduct.id}</p>
              <h2 id="dialog-title">{selectedProduct.name}</h2>
              <h3>{selectedProduct.subtitle}</h3>
              <p id="dialog-description">{selectedProduct.description}</p>
              <dl>
                <div><dt>Fabric</dt><dd>{selectedProduct.fabric}</dd></div>
                <div><dt>Colour</dt><dd>{selectedProduct.colors}</dd></div>
              </dl>
              <a className="primary-button" href={whatsappHref(selectedProduct)} target="_blank" rel="noreferrer">
                Inquire on WhatsApp <span aria-hidden="true">↗</span>
              </a>
              {selectedProduct.instagramUrl && (
                <a className="text-link" href={selectedProduct.instagramUrl} target="_blank" rel="noreferrer">Watch the story on Instagram ↗</a>
              )}
              <small>No online checkout. We’ll personally assist you on WhatsApp.</small>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
