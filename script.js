document.addEventListener("DOMContentLoaded", function () {
  const correctWachtwoord = "chiro2025";
  const alleGroepen = [
    "Ribbels", "Speelclubs", "Rakkers", "Kwiks",
    "Tippers", "Toppers", "Aspi", "LEIDING"
  ];
  const groepKleuren = {
    Ribbels: "#cce5ff",
    Speelclubs: "#ffe5cc",
    Rakkers: "#e5ffcc",
    Kwiks: "#ffccf2",
    Tippers: "#d5ccff",
    Toppers: "#ccffd5",
    Aspi: "#ffd5cc",
    LEIDING: "#dddddd"
  };

  const storage = firebase.storage();
  
  

  // Toggle paneel en laad samenvatting
  function setupSummaryToggle() {
    const btn = document.getElementById("toggleSummary");
    const content = document.getElementById("summaryContent");
    btn.addEventListener("click", () => {
      const open = content.style.display === "block";
      content.style.display = open ? "none" : "block";
      btn.textContent = (open ? "▸" : "▾") + " Toon uitgaven per groep";
      if (!open) renderSamenvatting();
    });
  }

  // Render per-groep overzicht met kleur
  function renderSamenvatting() {
    const lijst = document.getElementById("groepSamenvatting");
    lijst.innerHTML = "";
    const totals = {};
    alleGroepen.forEach(g => totals[g] = 0);

// ... bestaand rijwerk
const celActie = rij.insertCell(6);
// knop “Verwijder” ...
celActie.appendChild(knop);

// BONUS: thumbnail tonen
const celBon = rij.insertCell(7);
if (u.bonUrl) {
  const img = document.createElement("img");
  img.src = u.bonUrl;
  img.className = "thumbnail";
  img.title = "Klik voor volledige bon";
  img.onclick = () => window.open(u.bonUrl, "_blank");
  celBon.appendChild(img);
}
    
    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val() || {};
      Object.values(data).forEach(u => {
        totals[u.groep] += parseFloat(u.bedrag);
      });

      alleGroepen.forEach(groep => {
        const bedrag = totals[groep].toFixed(2);
        const li = document.createElement("li");
        li.style.backgroundColor = groepKleuren[groep] || "#fff";
        li.textContent = groep;
        const span = document.createElement("span");
        span.textContent = `€${bedrag}`;
        li.appendChild(span);
        lijst.appendChild(li);
      });
    });
  }

  // PDF-export setup met datum/tijd in de hoek
  function setupPdfExport() {
    const btn = document.getElementById("exportPdfBtn");
    btn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // datum/tijd stempel
      const now = new Date();
      const timestamp = now.toLocaleString("nl-NL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(10);
      doc.text(timestamp, pageWidth - 20, 10, { align: "right" });

      let y = 20;
      doc.setFontSize(16);
      doc.text("Uitgaven activiteitenkas per groep", 20, y);
      y += 10;

      // groepen vullen
      const totals = {};
      alleGroepen.forEach(g => totals[g] = []);

      const snap = await firebase.database().ref("uitgaven").once("value");
      const data = snap.val() || {};
      Object.values(data).forEach(u => totals[u.groep].push(u));

      alleGroepen.forEach(groep => {
        const items = totals[groep];
        if (!items.length) return;

        doc.setFontSize(14);
        doc.text(groep, 20, y);
        y += 8;
        doc.setFontSize(11);

        items.forEach(u => {
          const regel = `${u.datum} – €${u.bedrag} – ${u.activiteit} ${u.betaald ? "(Betaald)" : "(Niet betaald)"}`;
          doc.text(regel, 25, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });

        y += 8;
      });

      doc.save("uitgaven_activiteitenkas_per_groep.pdf");
    });
  }

  // Login logic
  function controleerWachtwoord() {
    const invoer = document.getElementById("wachtwoord").value;
    const fout = document.getElementById("loginFout");
    if (invoer === correctWachtwoord) {
      document.getElementById("loginScherm").style.display = "none";
      document.getElementById("appInhoud").style.display = "block";
      fout.textContent = "";
      setupSummaryToggle();
      setupPdfExport();
      renderTabel();
    } else {
      fout.textContent = "Wachtwoord is onjuist.";
    }
  }
  document.getElementById("loginKnop").addEventListener("click", controleerWachtwoord);

  // Overige functies (renderTabel, submit, filters) blijven ongewijzigd…
  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";
    firebase.database().ref("uitgaven").once("value", snap => {
      const data = snap.val() || {};
      Object.values(data)
        .filter(u => (!filterGroep || u.groep === filterGroep)
                   && (filterBetaald === "" || String(u.betaald) === filterBetaald))
        .sort((a, b) => b.nummer - a.nummer)
        .forEach(u => {
          const rij = tbody.insertRow();
          rij.style.backgroundColor = groepKleuren[u.groep] || "#fff";
          rij.insertCell(0).textContent = u.nummer;
          rij.insertCell(1).textContent = u.groep;
          rij.insertCell(2).textContent = `€${u.bedrag}`;
          rij.insertCell(3).textContent = u.activiteit;
          rij.insertCell(4).textContent = u.datum;
          rij.insertCell(5).textContent = u.betaald ? "✅" : "❌";

          const c6 = rij.insertCell(6);
          const btn = document.createElement("button");
          btn.textContent = "Verwijder";
          btn.className = "verwijder";
          btn.onclick = () => {
            firebase.database().ref("uitgaven/" + u.nummer).remove();
            renderTabel(
              document.getElementById("filterGroep").value,
              document.getElementById("filterBetaald").value
            );
          };
          c6.appendChild(btn);

          const c7 = rij.insertCell(7);
          c7.className = "betaald-toggle";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = u.betaald;
          cb.onchange = () => {
            firebase.database().ref("uitgaven/" + u.nummer)
              .update({ betaald: cb.checked }, err => {
                if (!err) renderTabel(
                  document.getElementById("filterGroep").value,
                  document.getElementById("filterBetaald").value
                );
              });
          };
          c7.appendChild(cb);
        });
    });
  }

  document.getElementById("uitgaveForm").addEventListener("submit", e => {
document.getElementById("uitgaveForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Lees velden
  const groep    = document.getElementById("groep").value;
  const bedrag   = parseFloat(document.getElementById("bedrag").value.replace(",", ".")) || 0;
  const activiteit = document.getElementById("activiteit").value;
  const datum    = document.getElementById("datum").value;
  const betaald  = document.getElementById("betaald").checked;

  if (!groep || isNaN(bedrag) || !activiteit || !datum) {
    return alert("Gelieve alle velden correct in te vullen.");
  }

  // Uniek nummer voor deze uitgave
  const nummer = Date.now().toString();

  // Check of er een bestand is geselecteerd
  const fileInput = document.getElementById("bon");
  let bonUrl = "";

  if (fileInput.files.length) {
    const bestand = fileInput.files[0];
    const ext = bestand.name.split('.').pop();
    const storageRef = storage.ref(`bonnen/${nummer}.${ext}`);

    // Uploaden
    const snapshot = await storageRef.put(bestand);
    // Download-URL ophalen
    bonUrl = await snapshot.ref.getDownloadURL();
  }

  // Nieuw uitgave-object inclusief bonUrl
  const nieuweUitgave = {
    nummer,
    groep,
    bedrag:   bedrag.toFixed(2),
    activiteit,
    datum,
    betaald,
    bonUrl    // lege string of echte URL
  };

  // Opslaan in Realtime Database
  firebase.database().ref("uitgaven/" + nummer).set(nieuweUitgave, error => {
    if (!error) {
      document.getElementById("uitgaveForm").reset();
      renderTabel(
        document.getElementById("filterGroep").value,
        document.getElementById("filterBetaald").value
      );
    }
  });
});

  document.getElementById("filterGroep")
    .addEventListener("change", e => renderTabel(e.target.value, document.getElementById("filterBetaald").value));

  document.getElementById("filterBetaald")
    .addEventListener("change", e => renderTabel(document.getElementById("filterGroep").value, e.target.value));
});




