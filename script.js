const ukedager = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
let uke = 0;

function finnMandag() {
  let dato = new Date();
  let dag = dato.getDay();
  dato.setHours(12, 0, 0, 0);

  if (dag == 0) {
    dato.setDate(dato.getDate() - 6);
  } else {
    dato.setDate(dato.getDate() - dag + 1);
  }
  return dato;
}

function leggTilDager(dato, dager) {
  let nyDato = new Date(dato);
  nyDato.setDate(nyDato.getDate() + dager);
  return nyDato;
}

function datoTekst(dato) {
  let aar = dato.getFullYear();
  let mnd = String(dato.getMonth() + 1).padStart(2, "0");
  let dag = String(dato.getDate()).padStart(2, "0");
  return aar + "-" + mnd + "-" + dag;
}

// Eksempel på trimturer. De vises flere uker fremover.
function eksempelTurer() {
  let turer = [];
  let mandag = finnMandag();

  for (let i = 0; i < 8; i++) {
    turer.push({
      navn: "Tur ved Røstad",
      dato: datoTekst(leggTilDager(mandag, i * 7 + 1)),
      tid: "11:00",
      leder: "Kari Hansen",
      start: "Nord universitet",
      rute: "Rundt Røstad",
      varighet: "1 time",
      plasser: 12,
      paameldte: 5,
      ekstra: "Ta med gode sko"
    });

    turer.push({
      navn: "Tur i sentrum",
      dato: datoTekst(leggTilDager(mandag, i * 7 + 3)),
      tid: "13:00",
      leder: "Ola Berg",
      start: "Levanger torg",
      rute: "Gjennom sentrum",
      varighet: "45 minutter",
      plasser: 10,
      paameldte: i == 1 ? 10 : 4,
      ekstra: "Rolig tempo"
    });
  }
  return turer;
}

function hentTurer() {
  let turer = eksempelTurer();
  let lagret = JSON.parse(localStorage.getItem("levaleva_turer") || "[]");
  return turer.concat(lagret);
}

// Lager kalenderen med denne uka og neste uke.
function visKalender() {
  let kalender = document.querySelector(".kalender");
  if (!kalender) return;

  let start = leggTilDager(finnMandag(), uke * 7);
  let turer = hentTurer();
  kalender.innerHTML = "";

  for (let u = 0; u < 2; u++) {
    let mandag = leggTilDager(start, u * 7);
    let sondag = leggTilDager(mandag, 6);
    let boks = document.createElement("section");
    boks.className = "uke";
    boks.innerHTML = "<h2>" + mandag.toLocaleDateString("nb-NO") +
      " - " + sondag.toLocaleDateString("nb-NO") + "</h2>";

    let dager = document.createElement("div");
    dager.className = "dager";

    for (let i = 0; i < 7; i++) {
      let dato = leggTilDager(mandag, i);
      let dag = document.createElement("div");
      dag.className = "dag";
      dag.innerHTML = "<strong>" + ukedager[i] + " " + dato.getDate() + "." +
        (dato.getMonth() + 1) + "</strong>";

      let funnet = false;
      for (let tur of turer) {
        if (tur.dato == datoTekst(dato)) {
          let knapp = document.createElement("button");
          knapp.textContent = tur.tid + " " + tur.navn;
          knapp.onclick = function () {
            visTur(tur);
          };
          dag.appendChild(knapp);
          funnet = true;
        }
      }
      if (!funnet) dag.innerHTML += "<small>Ingen tur</small>";
      dager.appendChild(dag);
    }
    boks.appendChild(dager);
    kalender.appendChild(boks);
  }
}

// Åpner vinduet med informasjon om turen.
function visTur(tur) {
  let ledige = tur.plasser - tur.paameldte;
  document.querySelector(".modal-tittel").textContent = tur.navn;
  document.querySelector(".modal-info").textContent =
    "Ledige plasser: " + ledige + " av " + tur.plasser + "\n" +
    "Dato: " + tur.dato + " kl. " + tur.tid + "\n" +
    "Turleder: " + tur.leder + "\n" +
    "Oppmøtested: " + tur.start + "\n" +
    "Hvor går turen: " + tur.rute + "\n" +
    "Varighet: " + tur.varighet + "\n" +
    "Ekstra: " + (tur.ekstra || "Ingen ekstra info");

  let knapp = document.querySelector(".paamelding");
  knapp.disabled = ledige <= 0;
  if (ledige > 0) {
    knapp.textContent = "Meld meg på";
  } else {
    knapp.textContent = "Fullt";
  }

  document.querySelector(".vaer-info").textContent = "";
  document.querySelector(".paamelding-info").textContent = "";
  document.querySelector(".tur-modal").showModal();
  visVaer(tur);
}

// Viser værmelding når turen er innen fire dager.
async function visVaer(tur) {
  let felt = document.querySelector(".vaer-info");
  let idag = new Date(datoTekst(new Date()) + "T12:00:00");
  let dato = new Date(tur.dato + "T12:00:00");
  let dager = Math.round((dato - idag) / 86400000);
  if (dager < 0 || dager > 3) return;

  felt.textContent = "Henter værmelding ...";
  try {
    let url = "https://api.open-meteo.com/v1/forecast?latitude=63.746&longitude=11.299&daily=temperature_2m_max,precipitation_sum&timezone=Europe%2FOslo&forecast_days=4";
    let svar = await fetch(url);
    let data = await svar.json();
    let nr = data.daily.time.indexOf(tur.dato);
    if (nr == -1) throw new Error("Ingen værdata");
    if (!document.querySelector(".tur-modal").open) return;
    felt.textContent = "Vær i Levanger: " + Math.round(data.daily.temperature_2m_max[nr]) +
      " °C, nedbør " + data.daily.precipitation_sum[nr] + " mm (Open-Meteo)";
  } catch (feil) {
    felt.textContent = "Værmelding er ikke tilgjengelig nå.";
  }
}

if (document.querySelector(".kalender")) {
  visKalender();

  document.querySelector(".forrige").onclick = function () {
    uke--;
    visKalender();
  };
  document.querySelector(".neste").onclick = function () {
    uke++;
    visKalender();
  };
  document.querySelector(".tilbake").onclick = function () {
    uke = 0;
    visKalender();
  };
  document.querySelector(".lukk").onclick = function () {
    document.querySelector(".tur-modal").close();
  };
  document.querySelector(".paamelding").onclick = function () {
    document.querySelector(".paamelding-info").textContent =
      "Påmelding med ID-porten kommer senere.";
  };
}

// Lagrer en ny demotur i nettleseren, uten backend.
let skjema = document.querySelector(".ny-tur-form");
if (skjema) {
  skjema.querySelector(".dato").value = datoTekst(leggTilDager(new Date(), 1));

  skjema.onsubmit = function (hendelse) {
    hendelse.preventDefault();
    let tur = {
      navn: skjema.querySelector(".tur-navn").value,
      dato: skjema.querySelector(".dato").value,
      tid: skjema.querySelector(".klokke").value,
      leder: skjema.querySelector(".turleder").value,
      start: skjema.querySelector(".start").value,
      rute: skjema.querySelector(".rute").value,
      varighet: skjema.querySelector(".varighet").value,
      plasser: Number(skjema.querySelector(".plasser").value),
      paameldte: 0,
      ekstra: skjema.querySelector(".ekstra").value
    };

    let turer = JSON.parse(localStorage.getItem("levaleva_turer") || "[]");
    turer.push(tur);
    localStorage.setItem("levaleva_turer", JSON.stringify(turer));
    skjema.querySelector(".lagret-melding").textContent =
      "Turen er lagret i denne nettleseren. Se den i kalenderen.";
    skjema.reset();
  };
}
