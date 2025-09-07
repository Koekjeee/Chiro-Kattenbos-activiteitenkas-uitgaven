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

  function renderTabel(filterGroep = "", filterBetaald = "") {
    const tbody = document.querySelector("#overzicht tbody");
    tbody.innerHTML = "";

    firebase.database().ref("uitgaven").once("value", snapshot => {
      const data = snapshot.val();
      const uitgaven = data ? Object.values(data) : [];

      uitgaven
        .filter(u => {
          const groepMatch = !filterGroep || u.groep === filterGroep;
          const betaaldMatch = filterBetaald === "" || String(u.betaald) === filterBetaald;
          return groepMatch && betaaldMatch;
        })
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

          const actieCel = rij.insertCell(6);
          const knop = document.createElement("button");
          knop.textContent = "Verwijder";
          knop.className = "verwijder";
          knop.onclick = () => {
            firebase.database().ref("uitgaven/" + u.nummer).remove();
            renderTabel(
              document.getElementById("filterGroep").value,
              document.getElementById("filterBetaald").value
            );
          };
          actieCel.appendChild(knop);

          const toggleCel = rij.insertCell(7);
          toggleCel.className = "betaald-toggle";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = u.betaald;
          checkbox.title = "Betaald aanvinken";
          checkbox.onchange = () => {
            firebase.database().ref("uitgaven/" + u.nummer).update({ betaald: checkbox.checked }, function (error) {
              if (!error) {
                renderTabel(
                  document.getElementById("filterGroep").value,
                  document.getElementById("filterBetaald").value
                );
              }
            });
          };
          toggleCel.appendChild(checkbox);
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
      betaald
    };

    firebase.database().ref("uitgaven/" + nummer).set(nieuweUitgave, function (error) {
      if (!error) {
        document.getElementById("uitgaveForm").reset();
        renderTabel(
          document.getElementById("filterGroep").value,
          document.getElementById("filterBetaald").value
        );
      }
    });
  });

  document.getElementById("filterGroep").addEventListener("change", function () {
    renderTabel(this.value, document.getElementById("filterBetaald").value);
  });

  document.getElementById("filterBetaald").addEventListener("change", function () {
    renderTabel(document.getElementById("filterGroep").value, this.value);
  });

// ✅ Toggle overzicht per groep
let overzichtZichtbaar = false;

document.getElementById("toonOverzicht").addEventListener("click", function () {
  const overzichtDiv = document.getElementById("groepOverzicht");

  if (overzichtZichtbaar) {
    overzichtDiv.innerHTML = "";
    overzichtZichtbaar = false;
    return;
  }

  overzichtDiv.innerHTML = "<p>Overzicht wordt geladen...</p>";
  overzichtZichtbaar = true;

  firebase.database().ref("uitgaven").once("value", snapshot => {
    const data = snapshot.val() || {};
    const totaalPerGroep = {};

    alleGroepen.forEach(groep => totaalPerGroep[groep] = 0);

    Object.values(data).forEach(u => {
      const bedrag = parseFloat(u.bedrag);
      if (!isNaN(bedrag)) {
        totaalPerGroep[u.groep] += bedrag;
      }
    });

    overzichtDiv.innerHTML = "<h3>Overzicht per groep</h3>";
    const tabel = document.createElement("table");
    tabel.className = "groepTabel";

    const header = tabel.insertRow();
    header.innerHTML = "<th>Groep</th><th>Totaal (€)</th>";
    header.className = "groepHeader";

    alleGroepen.forEach(groep => {
      const rij = tabel.insertRow();
      rij.style.backgroundColor = groepKleuren[groep] || "#f9f9f9";
      rij.insertCell(0).textContent = groep;
      rij.insertCell(1).textContent = `€${totaalPerGroep[groep].toFixed(2)}`;
    });

    overzichtDiv.appendChild(tabel);
  });
});

// ✅ Herstel instellingen per groep
function toonInstellingenVelden() {
  const container = document.getElementById("instellingenVelden");
  container.innerHTML = "";

  alleGroepen.forEach(groep => {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "10px";
    wrapper.style.backgroundColor = groepKleuren[groep] || "#f0f0f0";
    wrapper.style.padding = "10px";
    wrapper.style.borderRadius = "6px";

    const label = document.createElement("h4");
    label.textContent = groep;

    const ledenInput = document.createElement("input");
    ledenInput.type = "number";
    ledenInput.placeholder = "Aantal leden";
    ledenInput.id = `leden-${groep}`;
    ledenInput.style.marginRight = "10px";

    const bedragInput = document.createElement("input");
    bedragInput.type = "number";
    bedragInput.placeholder = "Max bedrag per lid (€)";
    bedragInput.id = `maxbedrag-${groep}`;

    wrapper.appendChild(label);
    wrapper.appendChild(ledenInput);
    wrapper.appendChild(bedragInput);
    container.appendChild(wrapper);
  });
}

toonInstellingenVelden();
}); // ✅ correct afgesloten


