// Live presentation and controls share the existing quotation calculator.
const liveLayout=document.querySelector('.layout');
const livePanel=document.querySelector('.panel');
livePanel.classList.add('live-controls');
const livePreview=document.createElement('section');
livePreview.id='livePreview';livePreview.className='live-preview';
livePreview.setAttribute('aria-label','Paparan pelanggan');
liveLayout.prepend(livePreview);
const liveHeading=document.createElement('div');
liveHeading.className='control-heading';
liveHeading.innerHTML='<div><span class="live-dot"></span> KAWALAN LIVE</div><button type="button" id="openDisplay">Buka paparan ↗</button>';
livePanel.prepend(liveHeading);
const vehicleControls=document.querySelector('.vehicle');
vehicleControls.classList.add('control-vehicle');
const financeControls=document.createElement('section');
financeControls.className='live-finance';
financeControls.innerHTML='<h3>Promo & pembiayaan</h3>';
const financeDialog=$('financeDialog');
for(const child of [...financeDialog.children]){
  if(!child.classList.contains('dialog-head')&&!child.hasAttribute('data-close'))financeControls.append(child);
}
const financeSummary=$('editFinance').closest('.finance-summary');
financeSummary.style.display='none';financeSummary.after(financeControls);
const liveActions=document.createElement('div');liveActions.className='live-actions';
liveActions.append($('bottomQuote'));livePanel.append(liveActions);
const quick=document.createElement('div');quick.className='quick-controls';
quick.innerHTML='<label>Deposit pantas</label><div class="seg"><button type="button" data-deposit="0">Full loan</button><button type="button" data-deposit="10">10%</button></div>';
document.querySelector('.loan-inputs').before(quick);
// Keep the frequently used inputs together at the top of the live controls.
const primaryControls=document.createElement('section');primaryControls.className='primary-controls';
vehicleControls.after(primaryControls);
primaryControls.append(quick,document.querySelector('.loan-inputs'),$('insurance').closest('.form-grid'),financeControls);
const packageControl=document.createElement('label');packageControl.id='livePackageField';packageControl.className='live-package';
packageControl.innerHTML='Pakej B10<select id="livePackage"><option value="ez5">EZ Five</option><option value="cash">Ala Carte</option></select>';
primaryControls.prepend(packageControl);
const liveRegistration=document.querySelector('.customer-registration');liveRegistration.classList.add('live-registration');primaryControls.prepend(liveRegistration);
liveRegistration.querySelector('label').textContent='JENIS PENDAFTARAN';
liveRegistration.querySelector('[data-reg="Private"]').textContent='Individual';
liveRegistration.querySelectorAll('button').forEach(button=>button.type='button');
$('livePackage').oninput=()=>{$('package').value=$('livePackage').value;update()};
const calculationDetails=document.createElement('details');calculationDetails.className='calculation-details';
calculationDetails.innerHTML='<summary>Pecahan harga & fi OTR</summary>';
const inlineFinance=document.querySelector('.inline-finance');inlineFinance.before(calculationDetails);calculationDetails.append(inlineFinance);
quick.querySelectorAll('button').forEach(button=>button.onclick=()=>{$('down').value=button.dataset.deposit==='0'?0:Math.round(calc().otr*.1);update()});
const displayOnly=new URLSearchParams(location.search).has('display');
document.body.classList.toggle('display-only',displayOnly);
let liveChannel;
try{liveChannel=new BroadcastChannel('leapmotor-live-display');liveChannel.onmessage=event=>{
  if(displayOnly&&event.data.type==='render')livePreview.innerHTML=event.data.html;
  else if(!displayOnly&&event.data.type==='ready')refreshLive();
};}catch{}
function refreshLive(){
  if(displayOnly)return;
  $('livePackageField').hidden=model!=='B10'||isDemo();$('livePackage').value=$('package').value;
  const c=calc(),m=currentVehicle(),p=offer(),cash=cashPurchase();

  const otrFees=c.roadtax+c.fees;
  // Show the promotional price separately from road tax, registration and insurance.
  // For B10, insurance coverage is a promotion applied against the OTR amount.
  const effectivePrice=Math.max(0,c.net-c.coverage);
  const promoDeductions=[];
  if(!isDemo()&&model==='B10'){
    promoDeductions.push(['Year End Bonus',4000]);
    if($('package').value==='cash')promoDeductions.push(['Ala Carte cash equivalents',4900]);
  }else if(!isDemo()&&model==='C10'){
    promoDeductions.push(['Cash Rebate',34000],['Year End Bonus',5100]);
    if(c10Benefit()==='cash')promoDeductions.push(['Cash benefit option',1000]);
  }
  if(!isDemo()&&num('rebate')>0)promoDeductions.push(['Additional rebate',num('rebate')]);
  if(c.coverage)promoDeductions.push(['Insurance Coverage · promo',c.coverage]);
  const priceLines=[['Harga asal / MSRP',money(c.price),''],...promoDeductions.map(([label,value])=>[label,'− '+money(value),'discount'])];
  const costLines=[['Fi OTR','+ '+money(otrFees),''],['Insurance selepas NCD','+ '+money(c.insurance),''],...(c.extras?[['22 kW wallbox upgrade','+ '+money(c.extras),'']]:[])];
  const priceLine=([label,value,kind=''])=>'<div class="price-breakdown-row '+kind+'"><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';
  const pricePanel='<div class="live-money-flow">'+
    '<section class="live-money-panel promo-panel">'+
      '<div class="money-section-label"><span>01</span><div><b>HARGA KERETA</b><small>'+esc(model==='B10'?(isKinetik()?'B10 Kinetik Edition':$('package').value==='cash'?'B10 Ala Carte':'B10 EZ Five'):'C10')+' · '+esc(registration==='Company'?'Company':'Individual')+'</small></div></div>'+
      '<dl class="price-breakdown">'+priceLines.map(priceLine).join('')+'</dl>'+
      '<div class="effective-price"><span>HARGA EFEKTIF SELEPAS PROMO</span><strong>'+money(effectivePrice)+'</strong><small>Sebelum fi OTR & premium insurance'+(c.coverage?' · termasuk Insurance Coverage promo':'')+'</small></div>'+
    '</section>'+
    '<section class="live-money-panel extras-panel">'+
      '<div class="money-section-label"><span>02</span><div><b>FI & INSURANCE</b><small>Ditambah kepada harga efektif</small></div></div>'+
      '<dl class="price-breakdown">'+costLines.map(priceLine).join('')+'</dl>'+
      '<details class="price-fee-details"><summary>Lihat pecahan fi OTR</summary><dl>'+
        [['Registration',num('registrationFee')],['Endorsement',num('endorsement')],['Road Tax',c.roadtax],['EV Plate',num('plateFee')],...(num('inspectionFee')?[['Inspection',num('inspectionFee')]]:[])].map(([label,value])=>priceLine([label,money(value)])).join('')+
      '</dl></details>'+
      '<div class="final-otr"><span>JUMLAH OTR TERMASUK INSURANCE</span><strong>'+money(c.otr)+'</strong><small>Harga efektif + fi OTR + insurance'+(c.extras?' + upgrade':'')+'</small></div>'+
    '</section>'+
  '</div>'+
  '<div class="live-finance-strip"><div class="money-section-label"><span>03</span><div><b>'+(cash?'PEMBELIAN TUNAI':'PEMBIAYAAN')+'</b><small>'+(cash?'Bayaran selepas trade-in':'Kiraan loan termasuk fi & insurance')+'</small></div></div>'+
    (cash?'<div class="finance-strip-figures"><div><span>Baki tunai</span><b>'+money(Math.max(0,c.otr-c.equity))+'</b></div></div>':
      '<div class="finance-strip-figures"><div><span>Deposit</span><b>'+money(c.down)+'</b></div><div><span>Jumlah loan</span><b>'+money(c.principal)+'</b></div></div>')+
  '</div>';
  liveRegistration.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reg===registration)));
  const benefits=isDemo()?'Unit demo · tanpa kempen promosi':p?
    (isKinetik()?'Kinetik Limited Edition · 6-year bodykit warranty · 20 units (2026) · ':'')+
    ($('package').value==='ez5'?'EZ Five: 22 kW wallbox, tint, charging credit & key fob included':'Ala Carte: rebate equivalent for tint, wallbox, charging credit & key fob'):
    'C10 bonus: '+(c10Benefit()==='wallbox'?'Free 7 kW wallbox':c10Benefit()==='tint'?'Free tint':'RM1,000 cash alternative');
  const photo=view==='exterior'?m.colours[colour][2]:interiorChoice().image;
  livePreview.innerHTML='<div class="preview-brand"><img src="assets/leapmotor-logo.png" alt="Leapmotor"><span>MALAYSIA · 100% ELECTRIC</span></div><p class="preview-eyebrow">KIRAAN PEMBIAYAAN KENDERAAN</p><h1>Leapmotor '+model+' <span>'+esc(m.variant)+'</span></h1><p class="preview-promo-headline">'+esc(promoHeadline())+'</p><p class="preview-colour">'+esc(m.colours[colour][0])+' · '+esc(interiorChoice().name)+' interior</p><div class="preview-car '+(isKinetik()?'kinetik-preview-car':'')+'"><img src="'+esc(photo)+'" alt="Leapmotor '+model+'"></div><div class="monthly-hero"><div><small>'+(cash?'Jumlah OTR':'Anggaran ansuran bulanan')+'</small><strong>'+money(cash?c.otr:c.monthly)+'</strong><span>'+(cash?'Pembelian tunai':c.years+' tahun · '+c.rate.toFixed(2)+'% p.a.')+'</span></div><div class="advisor-card"><b>'+esc($('advisor').value||'HILMI')+'</b><span>Leapmotor Sales Advisor</span></div></div><div class="preview-benefits"><b>PAKEJ & MANFAAT</b><p>'+esc(benefits)+'</p></div>'+pricePanel+(!cash?'<div class="tenure-cards">'+[9,7,5].map(years=>'<div class="'+(years===c.years?'selected':'')+'"><b>'+years+' Tahun</b><span>'+money(c.principal*(1+c.rate/100*years)/(years*12))+' <small>/bulan</small></span></div>').join('')+'</div>':'')+'<div class="preview-contact"><span>WhatsApp untuk pertanyaan</span><b>'+esc($('advisorPhone').value)+'</b></div><p class="preview-disclaimer">Anggaran sahaja. Tertakluk kepada pengesahan dealer, kelayakan kempen dan kelulusan bank.</p>';
  const heroBand=document.createElement('div');heroBand.className='preview-hero-band';
  const carPhoto=livePreview.querySelector('.preview-car');carPhoto.before(heroBand);
  heroBand.append(carPhoto,livePreview.querySelector('.monthly-hero'));
  liveChannel?.postMessage({type:'render',html:livePreview.innerHTML});
}
$('openDisplay').onclick=()=>window.open(location.pathname+'?display=1','leapmotor-display','width=850,height=1050');
document.addEventListener('input',()=>refreshLive());
document.addEventListener('click',event=>{if(event.target.closest('#livePreview'))return;refreshLive()});
if(displayOnly){
  livePreview.innerHTML='<p class="display-wait">Menunggu panel kawalan… Buka paparan melalui butang “Buka paparan” pada panel utama.</p>';
  liveChannel?.postMessage({type:'ready'});
}else refreshLive();
