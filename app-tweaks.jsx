/* global React, ReactDOM */
const { useEffect } = React;

function MKTweaks(){
  const [t, setTweak] = useTweaks(window.__TWEAKS__);

  useEffect(()=>{
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.dataset.mode = t.mode;
    const mt = document.getElementById('modeToggle');
    if(mt) mt.textContent = t.mode==='dark' ? 'Dark / Light' : 'Light / Dark';
    const ticker = document.getElementById('ticker');
    if(ticker) ticker.style.display = t.showTicker ? '' : 'none';
    document.getElementById('cursorDot').style.display = t.showCursor ? '' : 'none';
    document.getElementById('cursorRing').style.display = t.showCursor ? '' : 'none';
  }, [t]);

  // sync from external setMode (topbar button)
  useEffect(()=>{
    const onSetMode = (e)=>{
      if(e.detail && e.detail.mode && e.detail.mode !== t.mode){
        setTweak('mode', e.detail.mode);
      }
    };
    window.addEventListener('mk:setmode', onSetMode);
    return ()=>window.removeEventListener('mk:setmode', onSetMode);
  }, [t.mode, setTweak]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Accent">
        <TweakColor label="Blue" value={t.accent} onChange={v=>setTweak('accent', v)}
          options={['#1f4ed8','#0b2a78','#3b82f6','#1e3a8a','#2563eb','#0ea5e9']} />
      </TweakSection>
      <TweakSection title="Mode">
        <TweakRadio label="Theme" value={t.mode} onChange={v=>setTweak('mode', v)}
          options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} />
      </TweakSection>
      <TweakSection title="Chrome">
        <TweakToggle label="Custom cursor" value={t.showCursor} onChange={v=>setTweak('showCursor', v)} />
        <TweakToggle label="Publication ticker" value={t.showTicker} onChange={v=>setTweak('showTicker', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<MKTweaks/>);
