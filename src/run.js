import express from "express";
import exphbs from "express-handlebars";
import { connect, end, query } from "./db.js";

const PORT = 3000;
const WEB = "web";

const app = express();

app.engine(
  "handlebars",
  exphbs({
    helpers: {
      dateFormat: (date) => {
        if (date instanceof Date) {
          let year = "0000" + date.getFullYear();
          year = year.substr(-4);
          let month = "00" + (date.getMonth() + 1);
          month = month.substr(-2);
          let day = "00" + date.getDate();
          day = day.substr(-2);
          return `${year}-${month}-${day}`;
        }
        return date;
      },
    },
  }),
);
app.set("view engine", "handlebars");

app.use(express.static(WEB, {
  index: ["index.html"],
}));
app.use(express.urlencoded({
  extended: true,
}));

// Rodomi visi cekiai
app.get("/cekiai", async (req, res) => {
  // -----------SQL begin------------
  let conn;
  try {
    conn = await connect();
    const { results: cekiai } = await query(
      conn,
      `
    select
      id, data, parduotuve
    from cekiai
    order by
      data, parduotuve`,
    );
    res.render("cekiai", { cekiai });
  } catch (err) {
    res.render("klaida", { err });
  } finally {
    await end(conn);
  }
  // -----------SQL end------------
});

// Rodomi visi tipai
app.get("/tipai", async (req, res) => {
  // -----------SQL begin------------
  let conn;
  try {
    conn = await connect();
    const { results: tipai } = await query(
      conn,
      `
    select
      id, pavadinimas
    from tipai
    order by
      pavadinimas`,
    );
    res.render("tipai", { tipai });
  } catch (err) {
    res.render("klaida", { err });
  } finally {
    await end(conn);
  }
  // -----------SQL end------------
});

// Naujo tipo kurimas arba seno redagavimas (HTML FORMA)
app.get("/tipasEditNew", async (req, res) => {
  let tipas;
  if (req.query.id) {
    // paima is url ID parametra ir pakonvertuoja i skaiciu.
    // req.query.id = url id parametras
    // parseint = convertavimas i skaiciu
    const id = parseInt(req.query.id);
    // -----------SQL begin------------
    let conn;
    try {
      conn = await connect();
      let { results } = await query(
        conn,
        `
      select
        id, pavadinimas
      from tipai
      where id = ?`, [id]
      );
      // ----Jei tipo irasas bazeje pagal id nerandamas grazina vartotoja i visu tipu sarasa-----
      tipas = results;
      tipas = tipas[0];
      // console.log(tipas);
      if (!tipas) {
        res.redirect("/tipai");
        return
      }
      // -----------------------
    } catch (err) {
      res.render("klaida", { err });
    } finally {
      await end(conn);
    }
    // -----------SQL end------------
  }
  // jei tipas yra undefined - vadinasi kursim nauja
  // jei tipas rodo i objekta - redaguosim
  res.render('tipaiEditNew', { tipas });
})

// Naujo tipo kurimas arba seno redagavimas (IRASIMAS I BAZE)
app.post("/tipasSave", async (req, res) => {
  let tipas;
  let id;
  if (req.body.id) {
    id = parseInt(req.body.id);
  }
    // ---------------
    let conn;
    try {
      conn = await connect();
      let { results } = await query(
        conn,
        `
      select
        id, pavadinimas
      from tipai
      where id = ?`, [id]
      );
      tipas = results;
      tipas = tipas[0];

      let klaidos = [];
      if (!req.body.pavadinimas || req.body.pavadinimas.trim() === "") {
        klaidos.push("Pavadinimas negali būti tuščias")
      }

      // error html render
      if (klaidos.length > 0) {
        res.render('blogi-duomenys', { klaidos, tipas });
      } else {
        // Jei ID yra- redaguojam, jei nera- sukuriam nauja irasa
        if (req.body.id) {
          await query(
            conn,
            `update tipai
            set pavadinimas = ?
            where id = ?`,[req.body.pavadinimas, id]
          );
        } else {
          await query(
            conn,
            `insert into tipai (pavadinimas) values(?)`,[req.body.pavadinimas]
          );
        }
        res.redirect("/tipai");
      }
    } catch (err) {
      res.render("klaida", { err });
    } finally {
      await end(conn);
    }
    // ---------------
});



// Tipu trynimas
app.get("/tipasDelete", async (req, res) => {
  const id = parseInt(req.query.id); //console.log(req.query);
    // -----------SQL begin------------
    let conn;
    try {
      conn = await connect();
      await query(
        conn,
        `
        delete from tipai
        where id = ?`, [id]
      );
    } catch (err) {
      res.render("klaida", { err });
    } finally {
      await end(conn);
    }
    // -----------SQL end------------
    res.redirect("/tipai");
});

app.listen(PORT, () => {
  console.log(`Apskaita app listening at http://localhost:${PORT}`);
});
