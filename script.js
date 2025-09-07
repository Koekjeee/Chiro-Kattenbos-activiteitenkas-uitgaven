document.addEventListener("DOMContentLoaded", function () {
  // 🔐 Wachtwoordbeveiliging
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

  // 🔧 Maak de functie beschikbaar voor HTML onclick
  window.controleerWachtwoord = controleerWachtwoord;

  // 🎨 Kleuren per groep
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

  // 📋 Tabel opbouwen
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

  // ➕ Uitgave toevoegen
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

  // 🔍 Filter op groep
  document.getElementById("filterGroep").addEventListener("change", function () {
    renderTabel(this.value);
  });
});
