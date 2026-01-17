import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Rota chamada pelo QR CODE
app.get("/usar", async (req, res) => {
  const codigo = req.query.codigo;

  if (!codigo) {
    return res.json({ sucesso: false, mensagem: "Código não enviado." });
  }

  const { data } = await supabase
    .from("codigos_usados")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (!data) {
    await supabase.from("codigos_usados").insert([
      {
        codigo,
        validade: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ]);

    return res.json({
      sucesso: true,
      mensagem: "Código válido!",
      tempo: calcularTempo(codigo),
      instrucoes: calcularInstrucao(codigo)
    });
  }

  return res.json({
    sucesso: false,
    mensagem: "Código já usado!"
  });
});

// Rota usada pelo ESP32
app.get("/proximo", async (req, res) => {
  return res.json({ disponivel: false });
});

function calcularTempo(codigo) {
  if (codigo.startsWith("H")) return 80;
  if (codigo.startsWith("PZ")) return 160;
  if (codigo.startsWith("ND")) return 120;
  if (codigo.startsWith("PP")) return 120;
  if (codigo.startsWith("FT")) return 120;
  return 0;
}

function calcularInstrucao(codigo) {
  if (codigo.startsWith("H")) return "Não abra a embalagem para aquecer.";
  if (codigo.startsWith("PZ")) return "Abra ligeiramente para respirar.";
  if (codigo.startsWith("ND")) return "Retire a tampa de papel e mexa a meio.";
  if (codigo.startsWith("PP")) return "Retire do saco exterior.";
  if (codigo.startsWith("FT")) return "Abra ligeiramente.";
  return "Sem instruções.";
}

app.listen(3000, () => console.log("Backend online"));
