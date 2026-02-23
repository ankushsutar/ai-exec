async function ask() {
  const question = document.getElementById("question").value;

  const response = await fetch("http://localhost:3000/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  const data = await response.json();

  document.getElementById("summary").innerText = data.summary;
  document.getElementById("data").innerText = JSON.stringify(data.data, null, 2);
}
