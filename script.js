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

    if (!groep || isNaN(bedrag) || !activiteit || !datum) {
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
      if (!error) {
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

    Promise.all([
      firebase.database().ref("uitgaven").once("value"),
      firebase.database().ref("instellingen").once("value")
    ]).then(([uitgavenSnap, instellingenSnap]) => {
      const uitgavenData = uitgavenSnap.val() || {};
      const instellingenData = instellingenSnap.val() || {};
      const totaalPerGroep = {};

      Object.values(uitgavenData).forEach(u => {
        const bedrag = parseFloat(u.bedrag);
        if (!totaalPerGroep[u.groep]) totaalPerGroep[u.groep] = 0;
        totaalPerGroep[u.groep] += bedrag;
      });

      instellingenDiv.innerHTML = "";
      Object.keys(totaalPerGroep).forEach(groep => {
        const huidige = instellingenData[groep] || { leden: "", maxPerLid: "" };

       
