import React, { useEffect, useMemo, useState } from "react"
import gptsInicial from "./data/gpts.json"
import { QRCodeSVG } from "qrcode.react"

export default function App(){
  const [query, setQuery] = useState("")
  const [categoria, setCategoria] = useState("todas")
  const [soloPublicos, setSoloPublicos] = useState(false)
  const [orden, setOrden] = useState("recientes")
  const [qr, setQr] = useState(null)
  const [gpts, setGpts] = useState(gptsInicial)

  useEffect(()=>{ document.title = "Portafolio de GPTs" }, [])

  const categoriasUnicas = useMemo(()=>{
    const s = new Set()
    gpts.forEach(g => (g.categorias||[]).forEach(c => s.add(c)))
    return ["todas", ...Array.from(s).sort()]
  },[gpts])

  const filtrados = useMemo(()=>{
    let data = [...gpts]
    if(soloPublicos) data = data.filter(g=>g.publico)
    if(categoria!=="todas") data = data.filter(g=> (g.categorias||[]).includes(categoria))
    if(query.trim()){
      const q = query.toLowerCase()
      data = data.filter(g => 
        g.nombre.toLowerCase().includes(q) ||
        (g.descripcion||"").toLowerCase().includes(q) ||
        (g.etiquetas||[]).join(" ").toLowerCase().includes(q)
      )
    }
    if(orden==="recientes"){
      data.sort((a,b)=>(new Date(b.actualizado||0).getTime())-(new Date(a.actualizado||0).getTime()))
    }else if(orden==="alfabetico"){
      data.sort((a,b)=>a.nombre.localeCompare(b.nombre))
    }
    return data
  },[gpts, query, categoria, soloPublicos, orden])

  const copiar = async (texto) => {
    try{ await navigator.clipboard.writeText(texto); alert("Enlace copiado"); }catch(e){ alert("No se pudo copiar: "+e) }
  }

  const compartir = async (g) => {
    try{
      if(navigator.share){
        await navigator.share({ title: g.nombre, text: g.descripcion, url: g.url })
      }else{
        await copiar(g.url)
      }
    }catch{ /* cancelado */ }
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="title">Portafolio de GPTs</div>
          <div style={{marginLeft:"auto"}} />
          <a className="btn" href="https://chat.openai.com" target="_blank" rel="noreferrer">Abrir ChatGPT</a>
        </div>
      </header>

      <main className="container">
        <p style={{opacity:.85, marginTop:8, marginBottom:10}}>
          Muestra aquí los GPTs que has creado. Usa la búsqueda, filtros y orden para compartirlos fácilmente.
        </p>

        <div className="controls">
          <input className="input" placeholder="Buscar por nombre, descripción o etiqueta…" value={query} onChange={e=>setQuery(e.target.value)} />
          <select className="select" value={categoria} onChange={e=>setCategoria(e.target.value)}>
            {categoriasUnicas.map(c => <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
          </select>
          <select className="select" value={orden} onChange={e=>setOrden(e.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="alfabetico">A–Z</option>
          </select>
          <label className="switch">
            <input type="checkbox" checked={soloPublicos} onChange={e=>setSoloPublicos(e.target.checked)} />
            Solo públicos
          </label>
        </div>

        {filtrados.length===0 ? (
          <div className="empty">No hay resultados.</div>
        ) : (
          <section className="grid">
            {filtrados.map(g => (
              <article key={g.id} className="card">
                {g.hero && <img src={g.hero} alt={g.nombre} />}
                <div className="body">
                  <h3>{g.nombre}</h3>
                  <div style={{color:"#cbd5e1", fontSize:14}}>{g.descripcion}</div>
                  <div className="badges">
                    {(g.categorias||[]).map(c => <span key={c} className="badge">{c}</span>)}
                  </div>
                  <div className="tags">
                    {(g.etiquetas||[]).map(t => <span key={t} className="tag">#{t}</span>)}
                  </div>
                </div>
                <div className="footer">
                  <div style={{display:"flex", gap:8}}>
                    <button className="btn" onClick={()=>compartir(g)}>Compartir</button>
                    <button className="btn secondary" onClick={()=>copiar(g.url)}>Copiar enlace</button>
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <a className="btn" href={g.url} target="_blank" rel="noreferrer">Abrir</a>
                    <button className="btn" onClick={()=>setQr(g)}>QR</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="footer-note">
          © {new Date().getFullYear()} – Portafolio de GPTs. Edita la lista en <code>src/data/gpts.json</code>.
        </div>
      </main>

      {qr && (
        <div className="modal-backdrop" onClick={()=>setQr(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h4>Compartir “{qr.nombre}”</h4>
            <div className="label">Escanea el código o copia el enlace:</div>
            <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"10px 0 6px"}}>
              <QRCodeSVG value={qr.url} size={192} includeMargin />
              <button className="btn" onClick={()=>navigator.clipboard.writeText(qr.url)}>Copiar enlace</button>
            </div>
            <div className="actions">
              <button className="btn" onClick={()=>setQr(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
