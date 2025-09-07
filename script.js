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

  function controleerWachtwoord() {
    const invoer = document.getElementById("wachtwoord").value;
    const foutmelding = document.getElementById("loginFout");

    if (invoer === correctWachtwoord) {
      document.getElementById("loginScherm").style.display = "none";
      document.getElementById("appInhoud").style.display = "block";
      foutmelding.textContent = "";
      renderTabel();
    } else {
      foutmelding.textContent = "Wachtwoord is onjuist.";
    }
  }

  window.controleerWachtwoord = controleerWachtwoord;

  function renderTabel(filter = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val();
      const uitgaven = data ? Object.values(data) : [];

      uitgaven
        .filter(u => !filter || u.groep === filter)
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

          const bonCel = rij.insertCell(6);
          if (u.bonURL) {
            const link = document.createElement("a");
            link.href = u.bonURL;
            link.target = "_blank";
            link.textContent = "📎 Bonnetje";
            bonCel.appendChild(link);
          } else {
            bonCel.textContent = "-";
          }

          const actieCel = rij.insertCell(7);
          const knop = document.createElement("button");
          knop.textContent = "Verwijder";
          knop.className = "verwijder";
          knop.onclick = () => {
            firebase.database().ref("uitgaven/" + u.nummer).remove();
            renderTabel(document.getElementById("filterGroep").value);
          };
          actieCel.appendChild(knop);
        });
    });
  }

  document.getElementById("uitgaveForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const groep = document.getElementById("groep").value;
    const bedrag = parseFloat(document.getElementById("bedrag").value.replace(",", "."));
    const activiteit = document.getElementById("activiteit").value;
    const datum = document.getElementById("datum").value;
    const betaald = document.getElementById("betaald").checked;
    const bonFile = document.getElementById("bonnetje").files[0];

    if (!groep || isNaN(bedrag) || !activiteit || !datum) {
      alert("Gelieve alle velden correct in te vullen.");
      return;
    }

    const nummer = Date.now();
    const nieuweUitgave = {
      nummer,
      groep,
      bedrag: bedrag.toFixed(2),
      activiteit,
      datum,
      betaald,
      bonURL: ""
    };

    function opslaanMetBon(url = "") {
      nieuweUitgave.bonURL = url;
      firebase.database().ref("uitgaven/" + nummer).set(nieuweUitgave, function (error) {
        if (!error) {
          document.getElementById("uitgaveForm").reset();
          renderTabel(document.getElementById("filterGroep").value);
        }
      });
    }

    if (bonFile) {
      const storageRef = firebase.storage().ref("bonnetjes/" + nummer);
      storageRef.put(bonFile).then(snapshot => {
        snapshot.ref.getDownloadURL().then(opslaanMetBon);
      });
    } else {
      opslaanMetBon();
    }
  });

  document.getElementById("filterGroep").addEventListener("change", function () {
    renderTabel(this.value);
  });

  let overzichtZichtbaar = false;

  document.getElementById("toonOverzicht").addEventListener("click", function () {
    const overzichtDiv = document.getElementById("groepOverzicht");
    const instellingenDiv = document.getElementById("instellingenVelden");

    if (overzichtZichtbaar) {
      overzichtDiv.innerHTML = "";
      instellingenDiv.innerHTML = "";
      overzichtZichtbaar = false;
      return;
    }

    Promise.all([
      firebase.database().ref("uitgaven").once("value"),
      firebase.database().ref("instellingen").once("value")
    ]).then(([uitgavenSnap, instellingenSnap]) => {
      const uitgavenData = uitgavenSnap.val() || {};
      const instellingenData = instellingenSnap.val() || {};
      const totaalPerGroep = {};

      alleGroepen.forEach(groep => {
        totaalPerGroep[groep] = 0;
      });

      Object.values(uitgavenData).forEach(u => {
        const bedrag = parseFloat(u.bedrag);
        if (!totaalPerGroep[u.groep]) totaalPerGroep[u.groep] = 0;
        totaalPerGroep[u.groep] += bedrag;
      });

      instellingenDiv.innerHTML = "";
      alleGroepen.forEach(groep => {
        const huidige = instellingenData[groep] || { leden: "", maxPerLid: "" };

        const container = document.createElement("div");
        container.innerHTML = `
          <strong>${groep}</strong><br>
          Aantal leden: <input type="number" min="1" id="leden-${groep}" value="${huidige.leden}" style="width:60px">
          Max €/lid: <input type="number" min="0" step="0.01" id="max-${groep}" value="${huidige.maxPerLid}" style="width:80px">
        `;
        instellingenDiv.appendChild(container);

        ["leden", "max"].forEach(type => {
          const input = document.getElementById(`${type}-${groep}`);
          input.addEventListener("input", () => {
            const leden = parseInt(document.getElementById(`leden-${groep}`).value);
            const maxPerLid = parseFloat(document.getElementById(`max-${groep}`).value);

            firebase.database().ref("instellingen/" + groep).set({
              leden: isNaN(leden) ? 0 : leden,
              maxPerLid: isNaN(maxPerLid) ? 0 : maxPerLid
            });

            updateOverzicht();
          });
        });
      });

      overzichtDiv.innerHTML = "<h3>Overzicht per groep</h3>";
      const tabel = document.createElement("table");
      tabel.className = "groepTabel";

      const header = tabel.insertRow();
      header.innerHTML = "<th>Groep</th><th>Totaal (€)</th><th>Max toegestaan</th>";
      header.className = "groepHeader";

      alleGroepen.forEach(groep => {
        const totaal = totaalPerGroep[groep] || 0;
        const rij = tabel.insertRow();
        rij.style.backgroundColor = groepKleuren[groep] || "#f9f9f9";
        rij.setAttribute("data-groep", groep);
        rij.insertCell(0).textContent = groep;
        rij.insertCell(1).textContent = `€${totaal.toFixed(2)}`;
        rij.insertCell(2).textContent = "-";
      });

      overzichtDiv.appendChild(tabel);
      overzichtZichtbaar = true;
      updateOverzicht();
    });
  });

  function updateOverzicht() {
    const rows = document.querySelectorAll(".groepTabel tr[data-groep]");
    rows.forEach(row => {
      const groep = row.getAttribute("data-groep");
      const leden = parseInt(document.getElementById(`leden-${groep}`).value);
      const maxPerLid = parseFloat(document.getElementBy
