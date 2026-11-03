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
packageControl.innerHTML='Pakej B10<select id="livePackage"><option value="ez5">EZ 5</option><option value="cash">No Wallbox * No Credit</option></select>';
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
  const c=calc(),m=models[model],p=offer(),cash=cashPurchase();
  const priceRows=priceListRows();
  const rows=[['Vehicle rebate','− '+money(c.rebate)],['Insurance after NCD',money(c.insurance)],...(c.coverage?[['Insurance Coverage · OTR','− '+money(c.coverage)]]:[]),['Final OTR',money(c.otr)],...(!cash?[['Deposit',money(c.down)],['Loan amount',money(c.principal)]]:[])];
  const priceColumn=registration==='Company'?2:1;
  liveRegistration.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reg===registration)));
  const priceTable='<table class="live-price-table"><thead><tr><th scope="col">'+model+' · PENINSULAR MALAYSIA</th><th scope="col" class="chosen">'+(registration==='Company'?'COMPANY':'INDIVIDUAL')+' (RM)</th></tr></thead><tbody>'+priceRows.map((row,i)=>'<tr class="'+(i===5?'price-otr':'')+'"><th scope="row">'+row[0]+'</th><td>'+row[priceColumn].toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})+'</td></tr>').join('')+'</tbody></table>';

  const benefits=isDemo()?'Demo unit · Tiada promosi tambahan':p?(p.name+' · Insurance Coverage RM4,000'+($('package').value==='ez5'?' · Year End Bonus RM4,000':'')+'<br>'+esc(p.wallbox)+' · '+esc(p.charging)+'<br>Tint RM1,600'+($('keyFob').value==='Yes'?' · Key fob RM500':'')):'Rebat RM34,000 · Percuma wallbox 7kW & tinted';
  const photo=view==='exterior'?m.colours[colour][2]:interiorChoice().image;
  livePreview.innerHTML='<div class="preview-brand"><img src="assets/leapmotor-logo.png" alt="Leapmotor"><span>MALAYSIA · 100% ELECTRIC</span></div><p class="preview-eyebrow">KIRAAN PEMBIAYAAN KENDERAAN</p><h1>Leapmotor '+model+' <span>'+esc(m.variant)+'</span></h1><p class="preview-colour">'+esc(m.colours[colour][0])+' · '+esc(interiorChoice().name)+' interior</p><div class="preview-car"><img src="'+esc(photo)+'" alt="Leapmotor '+model+'"></div><div class="monthly-hero"><div><small>'+(cash?'Jumlah OTR':'Anggaran ansuran bulanan')+'</small><strong>'+money(cash?c.otr:c.monthly)+'</strong><span>'+(cash?'Pembelian tunai':c.years+' tahun · '+c.rate.toFixed(2)+'% p.a.')+'</span></div><div class="advisor-card"><b>'+esc($('advisor').value||'HILMI')+'</b><span>Leapmotor Sales Advisor</span></div></div><div class="preview-benefits"><b>PROMO & MANFAAT</b><p>'+benefits.replaceAll('<br>',' · ')+'</p></div>'+priceTable+'<dl class="preview-summary">'+rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>'+(!cash?'<div class="tenure-cards">'+[9,7,5].map(years=>'<div class="'+(years===c.years?'selected':'')+'"><b>'+years+' Tahun</b><span>'+money(c.principal*(1+c.rate/100*years)/(years*12))+' <small>/bulan</small></span></div>').join('')+'</div>':'')+'<div class="preview-contact"><span>WhatsApp untuk pertanyaan</span><b>'+esc($('advisorPhone').value)+'</b></div><p class="preview-disclaimer">Anggaran sahaja. Tertakluk kepada pengesahan dealer, kelayakan kempen dan kelulusan bank.</p>';
  const heroBand=document.createElement('div');heroBand.className='preview-hero-band';
  const carPhoto=livePreview.querySelector('.preview-car');carPhoto.before(heroBand);
  heroBand.append(carPhoto,livePreview.querySelector('.monthly-hero'));
  livePreview.querySelectorAll('.preview-summary>div').forEach(row=>{
    if(row.querySelector('dt').textContent==='Final OTR')row.classList.add('summary-otr');
  });
  liveChannel?.postMessage({type:'render',html:livePreview.innerHTML});
}
$('openDisplay').onclick=()=>window.open(location.pathname+'?display=1','leapmotor-display','width=850,height=1050');
document.addEventListener('input',()=>refreshLive());
document.addEventListener('click',()=>refreshLive());
if(displayOnly){
  livePreview.innerHTML='<p class="display-wait">Menunggu panel kawalan… Buka paparan melalui butang “Buka paparan” pada panel utama.</p>';
  liveChannel?.postMessage({type:'ready'});
}else refreshLive();
