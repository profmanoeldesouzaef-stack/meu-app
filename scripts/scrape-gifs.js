import https from "https";
import fs from "fs";

const folders = [
  { id: "15oJZjcltr5pQzecM7Z0d_Sgkyk5TW6ha", name: "Abdominal" },
  { id: "1HG9rf7RjzPGkx04MsBNpCMqH1KnQhtTZ", name: "Alongamentos e Mobilidade" },
  { id: "1c_4dyXHrQu9v9YHUgPB1MDj6CMD0tj4h", name: "Antebraço" },
  { id: "1g9dn88BK6qmbuJYnnm3ophuw605hRK5J", name: "Bíceps" },
  { id: "1Cdz5hOIuXJSGMEwX-rr-esSb6CADbTo9", name: "Cardio" },
  { id: "1X8ivdEM-bYvw-O1Xg9xEwV_PoxFfLV07", name: "Costas" },
  { id: "1GBBuxus0Uboo4dsrCA18dys873-ghadv", name: "Eretores da espinha" },
  { id: "1mQciEaDdIi5Y6lr1DZfknLK4sjPL6VcW", name: "Glúteos" },
  { id: "1V8mNFc1t2IX7vZl1S30dfcLw5CQ3nnRE", name: "Membros Inferiores" },
  { id: "1PZ3IaKlKXIsAvU2YRbAjOQOvAYm5dlhF", name: "Ombros" },
  { id: "1P0rnSlRTyirpzWejHAtc-uLQ4G8V30Nm", name: "Panturrilhas" },
  { id: "1etjZjdCjpYD8Vgu17ndNckpojfBMy5if", name: "Peitoral" },
  { id: "1kRQ-AovARpCbYPqxZJUYAw1DPz1LKhBp", name: "Pernas" },
  { id: "1v-AL3cBPeEjnMKOTucZojxaarDKzPDX6", name: "Trapézio" },
  { id: "1pXgNE5kB0AOXJ_p9Qp8ESijzNogxDTOL", name: "Tríceps" },
  { id: "16Bdefn76M-1K3IvJ1a6OatS6m4aZIjXG", name: "Crossfit" },
  { id: "1pnMHiZrPLYoKyoHG6qIz-Nq_jAeXsEPJ", name: "Calistenia" },
  { id: "1z3izUp13LGfjQc-r_sf01SDVWlqquQK6", name: "Funcional e HIIT" }
];

function fetchFolder(folder) {
  return new Promise((resolve) => {
    https.get("https://drive.google.com/drive/folders/" + folder.id, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        const unescaped = data
          .replace(/\\x22/g, '"')
          .replace(/\\x5b/g, "[")
          .replace(/\\x5d/g, "]")
          .replace(/\\\//g, "/");
        const reg = /"([1a-zA-Z0-9_-]{25,})",\["[1a-zA-Z0-9_-]{25,}"\],"([^"]+\.gif)"/gi;
        let m;
        const items = [];
        while ((m = reg.exec(unescaped)) !== null) {
          const rawTitle = m[2].replace(/\.gif$/i, "").trim();
          items.push({
            id: m[1],
            fileName: m[2],
            title: rawTitle,
            category: folder.name,
            gifUrl: `https://lh3.googleusercontent.com/d/${m[1]}`,
            previewUrl: `https://drive.google.com/file/d/${m[1]}/preview`
          });
        }
        resolve(items);
      });
    }).on("error", () => resolve([]));
  });
}

async function main() {
  if (!fs.existsSync("src/data")) {
    fs.mkdirSync("src/data", { recursive: true });
  }

  const allGifs = [];
  for (const f of folders) {
    const items = await fetchFolder(f);
    console.log(`${f.name}: found ${items.length} gifs`);
    allGifs.push(...items);
  }

  console.log(`TOTAL GIFS SCRAPED: ${allGifs.length}`);
  fs.writeFileSync("src/data/exerciseGifs.json", JSON.stringify(allGifs, null, 2));
  console.log("Written to src/data/exerciseGifs.json successfully!");
}

main();
