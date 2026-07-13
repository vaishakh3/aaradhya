"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "../../lib/content";
import styles from "./AdminPanel.module.css";

type Notice = { title: string; message: string; tone?: "warning" | "error" | "success" };

const blankProduct = (): Product => ({
  id: "",
  name: "",
  category: "Sarees",
  subtitle: "",
  fabric: "",
  description: "",
  colors: "",
  image: "",
  imageAlt: "",
  instagramUrl: "",
  active: true,
  sort: 0,
});

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.message || "Something went wrong.");
  return data as T;
}

export default function AdminPanel() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [configured, setConfigured] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Product>(blankProduct);
  const [notice, setNotice] = useState<Notice>({ title: "Loading products", message: "Please wait a moment." });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(["Sarees", "Sets", "Occasion", ...products.map((product) => product.category)])).filter(Boolean),
    [products],
  );

  const loadProducts = useCallback(async () => {
    try {
      setNotice({ title: "Loading products", message: "Reading the Aaradhya collection." });
      const data = await requestJson<{ ok: true; products: Product[]; configured: boolean; source: string }>(
        "/api/admin/products",
      );
      setProducts(data.products);
      setConfigured(data.configured);
      setNotice(
        data.configured
          ? { title: "Connected to Google Sheets", message: "Saved changes publish to the collection automatically.", tone: "success" }
          : {
              title: "Google Sheets is not connected yet",
              message: "You can review the default products, but saving requires the Google and Cloudinary environment settings.",
              tone: "warning",
            },
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("sign in")) setSignedIn(false);
      setNotice({ title: "Products could not be loaded", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    }
  }, []);

  useEffect(() => {
    requestJson<{ signedIn: boolean }>("/api/admin/session")
      .then(async (session) => {
        setSignedIn(session.signedIn);
        if (session.signedIn) await loadProducts();
      })
      .catch(() => setSignedIn(false))
      .finally(() => setCheckingSession(false));
  }, [loadProducts]);

  const startNew = () => {
    setEditingId(null);
    setDraft(blankProduct());
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setDraft({ ...blankProduct(), ...product });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await requestJson("/api/admin/session", {
        method: "POST",
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      setSignedIn(true);
      await loadProducts();
    } catch (error) {
      setNotice({ title: "Sign in failed", message: error instanceof Error ? error.message : "Check your credentials.", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setSignedIn(false);
    setProducts([]);
    startNew();
  };

  const updateDraft = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setNotice({ title: "Uploading image", message: "Sending the product image securely to Cloudinary." });
    try {
      const signature = await requestJson<{
        cloudName: string;
        apiKey: string;
        folder: string;
        timestamp: number;
        signature: string;
      }>("/api/admin/cloudinary-signature", { method: "POST", body: "{}" });
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("folder", signature.folder);
      body.append("timestamp", String(signature.timestamp));
      body.append("signature", signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: "POST",
        body,
      });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.error?.message || "Image upload failed.");
      updateDraft("image", uploaded.secure_url);
      setNotice({ title: "Image uploaded", message: "Save the product to publish this image.", tone: "success" });
    } catch (error) {
      setNotice({ title: "Upload failed", message: error instanceof Error ? error.message : "Try another image.", tone: "error" });
    } finally {
      setUploading(false);
    }
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.image) {
      setNotice({ title: "Image required", message: "Upload an image or paste an image URL before saving.", tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      const wasEditing = Boolean(editingId);
      const method = wasEditing ? "PUT" : "POST";
      await requestJson("/api/admin/products", {
        method,
        body: JSON.stringify({ id: editingId, product: draft }),
      });
      startNew();
      await loadProducts();
      setNotice({ title: wasEditing ? "Product updated" : "Product added", message: "The storefront now uses the latest collection data.", tone: "success" });
    } catch (error) {
      setNotice({ title: "Save failed", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product: Product) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    try {
      await requestJson("/api/admin/products", { method: "DELETE", body: JSON.stringify({ id: product.id }) });
      if (editingId === product.id) startNew();
      await loadProducts();
    } catch (error) {
      setNotice({ title: "Delete failed", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
    }
  };

  const moveProduct = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= products.length) return;
    const reordered = [...products];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    setProducts(reordered);
    try {
      await requestJson("/api/admin/products", {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: reordered.map((product) => product.id) }),
      });
      setNotice({ title: "Display order saved", message: "The collection has been reordered.", tone: "success" });
    } catch (error) {
      setNotice({ title: "Reorder failed", message: error instanceof Error ? error.message : "Try again.", tone: "error" });
      await loadProducts();
    }
  };

  if (checkingSession) {
    return <main className={styles.loading}><img src="/brand/aaradhya-logo.svg" alt="Aaradhya" /><p>Opening the collection studio…</p></main>;
  }

  if (!signedIn) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginVisual}>
          <header className={styles.loginTopbar}>
            <Link href="/" className={styles.loginLogo} aria-label="Return to the Aaradhya website">
              <img src="/brand/aaradhya-logo.svg" alt="Aaradhya" />
            </Link>
            <Link href="/" className={styles.backLink}>
              <span>View the collection</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </Link>
          </header>

          <div className={styles.loginStory}>
            <p><span />Aaradhya private studio</p>
            <h1>The collection,<br /><em>considered.</em></h1>
            <div className={styles.loginStoryNote}>
              <span>01</span>
              <p>A quiet workspace to shape every piece, detail and story before it meets the world.</p>
            </div>
          </div>

          <div className={styles.loginVisualFooter}>
            <span>Where elegance becomes an identity</span>
            <span>India · Est. 2026</span>
          </div>
        </section>

        <section className={styles.loginAccess}>
          <div className={styles.loginStamp} aria-hidden="true" />
          <form className={styles.loginCard} onSubmit={login}>
            <div className={styles.loginCardHeading}>
              <div className={styles.loginCardIndex}><span>Private access</span><span>02 / Studio</span></div>
              <h2>Welcome<br /><em>back.</em></h2>
              <p>Sign in to curate the Aaradhya collection.</p>
            </div>

            <div className={styles.loginField}>
              <label htmlFor="admin-username">Username</label>
              <input
                id="admin-username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Studio username"
                required
              />
            </div>
            <div className={styles.loginField}>
              <label htmlFor="admin-password">Password</label>
              <span className={styles.passwordField}>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </div>

            <button className={styles.loginSubmit} disabled={saving}>
              <span>{saving ? "Opening studio…" : "Enter the studio"}</span>
              <span className={styles.loginSubmitIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
              </span>
            </button>

            {notice.tone === "error" && <small className={styles.loginError} role="alert">{notice.message}</small>}
            <p className={styles.loginSecurity}><span />Protected collection management</p>
          </form>
          <p className={styles.loginAccessFooter}>Aaradhya · Collection studio</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.adminPage}>
      <header className={styles.header}>
        <Link href="/" aria-label="Open Aaradhya website"><img src="/brand/aaradhya-logo.svg" alt="" /><span><strong>Aaradhya</strong><small>Collection studio</small></span></Link>
        <div><a href="/" target="_blank" rel="noreferrer">View website ↗</a><button onClick={logout}>Sign out</button></div>
      </header>

      <section className={`${styles.notice} ${notice.tone ? styles[notice.tone] : ""}`} aria-live="polite">
        <strong>{notice.title}</strong><span>{notice.message}</span>
      </section>

      <section className={styles.workspace}>
        <div className={styles.collectionPanel}>
          <div className={styles.panelHeading}>
            <div><p>Collection</p><h1>Products <span>{products.length}</span></h1></div>
            <button onClick={startNew}>+ Add product</button>
          </div>
          <div className={styles.productList}>
            {products.map((product, index) => (
              <article className={`${styles.productRow} ${editingId === product.id ? styles.selected : ""}`} key={product.id}>
                <img src={product.image} alt="" />
                <div className={styles.productCopy}><small>{product.category} · {product.id}</small><strong>{product.name}</strong><span>{product.subtitle || product.fabric}</span><em>{product.active === false ? "Hidden" : "Visible"}</em></div>
                <div className={styles.orderActions}><button disabled={index === 0 || !configured} onClick={() => moveProduct(index, -1)} aria-label={`Move ${product.name} up`}>↑</button><button disabled={index === products.length - 1 || !configured} onClick={() => moveProduct(index, 1)} aria-label={`Move ${product.name} down`}>↓</button></div>
                <div className={styles.rowActions}><button onClick={() => startEdit(product)}>Edit</button><button onClick={() => removeProduct(product)} disabled={!configured}>Delete</button></div>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.editorPanel}>
          <div className={styles.panelHeading}><div><p>{editingId ? "Editing product" : "New product"}</p><h2>{editingId ? draft.name : "Add a piece"}</h2></div>{editingId && <button onClick={startNew}>Cancel</button>}</div>
          <form className={styles.productForm} onSubmit={saveProduct}>
            <div className={styles.imageField}>
              {draft.image ? <img src={draft.image} alt="Product preview" /> : <div><span>Image preview</span></div>}
              <label>{uploading ? "Uploading…" : "Upload image"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => uploadImage(event.target.files?.[0])} /></label>
            </div>
            <label>Image URL<input value={draft.image} onChange={(event) => updateDraft("image", event.target.value)} placeholder="Cloudinary or image URL" /></label>
            <div className={styles.fieldGrid}><label>Product name<input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} required /></label><label>Category<input list="product-categories" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} required /><datalist id="product-categories">{categories.map((category) => <option value={category} key={category} />)}</datalist></label></div>
            <label>Short description<input value={draft.subtitle} onChange={(event) => updateDraft("subtitle", event.target.value)} placeholder="Example: Aubergine handloom saree" /></label>
            <div className={styles.fieldGrid}><label>Fabric<input value={draft.fabric} onChange={(event) => updateDraft("fabric", event.target.value)} /></label><label>Colours<input value={draft.colors} onChange={(event) => updateDraft("colors", event.target.value)} /></label></div>
            <label>Product story<textarea rows={4} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></label>
            <label>Image description<input value={draft.imageAlt} onChange={(event) => updateDraft("imageAlt", event.target.value)} placeholder="Describe the garment for accessibility" /></label>
            <label>Instagram link<input type="url" value={draft.instagramUrl || ""} onChange={(event) => updateDraft("instagramUrl", event.target.value)} placeholder="https://instagram.com/…" /></label>
            <label className={styles.checkField}><input type="checkbox" checked={draft.active !== false} onChange={(event) => updateDraft("active", event.target.checked)} /><span>Show this product on the website</span></label>
            <button className={styles.saveButton} disabled={saving || uploading || !configured}>{saving ? "Saving…" : editingId ? "Save changes" : "Add product"}</button>
            {!configured && <small className={styles.formHint}>Connect Google Sheets in the deployment settings to enable saving.</small>}
          </form>
        </aside>
      </section>
    </main>
  );
}
