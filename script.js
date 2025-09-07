document.addEventListener("DOMContentLoaded", function () {
  const correctWachtwoord = "chiro2025";

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

          const actieCel = rij.insertCell(5);
          const knop = document.createElement("button");
          knop.textContent = "Verwijder";
          knop.className = "verwijder";
          knop.onclick = () => {
            if (confirm(`Weet je zeker dat je uitgave wilt verwijderen?`)) {
              firebase.database().ref("uitgaven/" + u.nummer).remove();
              renderTabel(document.getElementById("filterGroep").value);
            }
          };
          actieCel.appendChild(knop);
        });
    });
  }

  document.getElementById("uitgaveForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const groep = document.getElementById("groep").value.trim();
    const rawBedrag = document.getElementById("bedrag").value.trim().replace(",", ".");
    const bedrag = parseFloat(rawBedrag);
    const activiteit = document.getElementById("activiteit").value.trim();
    const datum = document.getElementById("datum").value;

    if (!groep || isNaN(bedrag) || bedrag <= 0 || !activiteit || !datum) {
      alert("Gelieve alle velden correct in te vullen.");
      return;
    }

    const nieuweUitgave = {
      nummer: Date.now(),
      groep,
      bedrag: bedrag.toFixed(2),
      activiteit,
      datum
    };

    firebase.database().ref("uitgaven/" + nieuweUitgave.nummer).set(nieuweUitgave, function (error) {
      if (error) {
        alert("Fout bij opslaan: " + error.message);
      } else {
        document.getElementById("uitgaveForm").reset();
        renderTabel(document.getElementById("filterGroep").value);
      }
    });
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

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val();
      const uitgaven = data ? Object.values(data) : [];

      const totaalPerGroep = {};

      uitgaven.forEach(u => {
        const bedrag = parseFloat(u.bedrag);
        if (!totaalPerGroep[u.groep]) {
          totaalPerGroep[u.groep] = 0;
        }
        totaalPerGroep[u.groep] += bedrag;
      });

      instellingenDiv.innerHTML = "";
      Object.keys(totaalPerGroep).forEach(groep => {
        const container = document.createElement("div");
        container.style.marginBottom = "10px";

        container.innerHTML = `
          <strong>${groep}</strong><br>
          Aantal leden: <input type="number" min="1" id="leden-${groep}" style="width:60px">
          Max €/lid: <input type="number" min="0" step="0.01" id="max-${groep}" style="width:80px">
        `;

        instellingenDiv.appendChild(container);
      });

      overzichtDiv.innerHTML = "<h3>Overzicht per groep</h3>";
      const tabel = document.createElement("table");
      tabel.className = "groepTabel";

      const header = tabel.insertRow();
      header.innerHTML = "<th>Groep</th><th>Totaal (€)</th><th>Max toegestaan</th>";
      header.className = "groepHeader";

      Object.entries(totaalPerGroep).forEach(([groep, totaal]) => {
        const rij = tabel.insertRow();
        rij.style.backgroundColor = groepKleuren[groep] || "#f9f9f9";

        const ledenInput = document.getElementById(`leden-${groep}`);
        const maxInput = document.getElementById(`max-${groep}`);

        [ledenInput, maxInput].forEach(input => {
          input.addEventListener("input", () => updateOverzicht());
        });

        rij.setAttribute("data-groep", groep);
        rij.insertCell(0).textContent = groep;
        rij.insertCell(1).textContent = `€${totaal.toFixed(2)}`;
        rij.insertCell(2).textContent = "-";
      });

      overzichtDiv.appendChild(tabel);
      overzichtZichtbaar = true;
    });
  });

  function updateOverzicht() {
    const rows = document.querySelectorAll(".groepTabel tr[data-groep]");

    rows.forEach(row => {
      const groep = row.getAttribute("data-groep");
      const leden = parseInt(document.getElementById(`leden-${groep}`).value);
      const maxPerLid = parseFloat(document.getElementById(`max-${groep}`).value);
      const totaalCell = row.cells[1];
      const maxCell = row.cells[2];

      if (!isNaN(leden) && !isNaN(maxPerLid)) {
        const maxToegestaan = leden * maxPerLid;
        const totaal = parseFloat(totaalCell.textContent.replace("€", ""));
        maxCell.textContent = `€${maxToegestaan.toFixed(2)}`;

        if (totaal >= maxToegestaan) {
          totaalCell.style.color = "red";
          totaalCell.style.fontWeight = "bold";
        } else if (totaal >= maxToegestaan * 0.9) {
          totaalCell.style.color = "orange";
          totaalCell.style.fontWeight = "bold";
        } else {
          totaalCell.style.color = "black";
          totaalCell.style.fontWeight = "normal";
        }
      } else {
        maxCell.textContent = "-";
        totaalCell.style.color = "black";
        totaalCell.style.fontWeight = "normal";
      }
    });
  }
});
