import express from "express";
import cors from "cors";
import { initDB } from "./database";

const app = express();

app.use(cors());
app.use(express.json());

let db: any;

initDB().then((database) => {
  db = database;
});

const validStatuses = ["pendiente", "confirmada", "cancelada"];
const validTimes = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00"
];

const isValidStatus = (status: string) => validStatuses.includes(status);

const isFutureOrTodayDate = (date: string) => {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selected = new Date(`${date}T00:00:00`);
  return selected >= todayOnly;
};

const isValidTime = (time: string) => validTimes.includes(time);

// GET - listar citas
app.get("/appointments", async (req, res) => {
  const data = await db.all(
    "SELECT * FROM appointments ORDER BY appointmentDate ASC, appointmentTime ASC"
  );
  res.json(data);
});

// POST - crear cita
app.post("/appointments", async (req, res) => {
  const {
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    reason
  } = req.body;

  if (
    !patientName?.trim() ||
    !doctorName?.trim() ||
    !appointmentDate?.trim() ||
    !appointmentTime?.trim() ||
    !reason?.trim()
  ) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  if (patientName.trim().length < 3) {
    return res.status(400).json({
      message: "El nombre del paciente debe tener al menos 3 caracteres"
    });
  }

  if (doctorName.trim().length < 3) {
    return res.status(400).json({
      message: "El nombre del doctor debe tener al menos 3 caracteres"
    });
  }

  if (reason.trim().length < 5) {
    return res.status(400).json({
      message: "El motivo debe tener al menos 5 caracteres"
    });
  }

  if (!isFutureOrTodayDate(appointmentDate)) {
    return res.status(400).json({
      message: "No se permiten fechas pasadas"
    });
  }

  if (!isValidTime(appointmentTime)) {
    return res.status(400).json({
      message: "La hora debe estar entre 08:00 y 17:00 en bloques de 1 hora"
    });
  }

  const existingAppointment = await db.get(
    `SELECT * FROM appointments
     WHERE appointmentDate = ? AND appointmentTime = ?`,
    [appointmentDate, appointmentTime]
  );

  if (existingAppointment) {
    return res.status(400).json({
      message: "Ya existe una cita registrada en esa fecha y hora"
    });
  }

  const result = await db.run(
    `INSERT INTO appointments
    (patientName, doctorName, appointmentDate, appointmentTime, reason, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      patientName.trim(),
      doctorName.trim(),
      appointmentDate,
      appointmentTime,
      reason.trim(),
      "pendiente",
      new Date().toISOString()
    ]
  );

  const newAppointment = await db.get(
    "SELECT * FROM appointments WHERE id = ?",
    [result.lastID]
  );

  res.status(201).json(newAppointment);
});

// PUT - editar cita completa
app.put("/appointments/:id", async (req, res) => {
  const id = req.params.id;
  const {
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    reason
  } = req.body;

  if (
    !patientName?.trim() ||
    !doctorName?.trim() ||
    !appointmentDate?.trim() ||
    !appointmentTime?.trim() ||
    !reason?.trim()
  ) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  if (patientName.trim().length < 3) {
    return res.status(400).json({
      message: "El nombre del paciente debe tener al menos 3 caracteres"
    });
  }

  if (doctorName.trim().length < 3) {
    return res.status(400).json({
      message: "El nombre del doctor debe tener al menos 3 caracteres"
    });
  }

  if (reason.trim().length < 5) {
    return res.status(400).json({
      message: "El motivo debe tener al menos 5 caracteres"
    });
  }

  if (!isFutureOrTodayDate(appointmentDate)) {
    return res.status(400).json({
      message: "No se permiten fechas pasadas"
    });
  }

  if (!isValidTime(appointmentTime)) {
    return res.status(400).json({
      message: "La hora debe estar entre 08:00 y 17:00 en bloques de 1 hora"
    });
  }

  const existingAppointment = await db.get(
    "SELECT * FROM appointments WHERE id = ?",
    [id]
  );

  if (!existingAppointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }

  const duplicatedAppointment = await db.get(
    `SELECT * FROM appointments
     WHERE appointmentDate = ? AND appointmentTime = ? AND id != ?`,
    [appointmentDate, appointmentTime, id]
  );

  if (duplicatedAppointment) {
    return res.status(400).json({
      message: "Ya existe otra cita registrada en esa fecha y hora"
    });
  }

  await db.run(
    `UPDATE appointments
     SET patientName = ?, doctorName = ?, appointmentDate = ?, appointmentTime = ?, reason = ?
     WHERE id = ?`,
    [
      patientName.trim(),
      doctorName.trim(),
      appointmentDate,
      appointmentTime,
      reason.trim(),
      id
    ]
  );

  const updatedAppointment = await db.get(
    "SELECT * FROM appointments WHERE id = ?",
    [id]
  );

  res.json(updatedAppointment);
});

// PATCH - cambiar estado
app.patch("/appointments/:id/status", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!isValidStatus(status)) {
    return res.status(400).json({ message: "Estado inválido" });
  }

  const existingAppointment = await db.get(
    "SELECT * FROM appointments WHERE id = ?",
    [id]
  );

  if (!existingAppointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }

  await db.run(
    "UPDATE appointments SET status = ? WHERE id = ?",
    [status, id]
  );

  const updatedAppointment = await db.get(
    "SELECT * FROM appointments WHERE id = ?",
    [id]
  );

  res.json(updatedAppointment);
});

// DELETE - eliminar cita
app.delete("/appointments/:id", async (req, res) => {
  const id = req.params.id;

  const existingAppointment = await db.get(
    "SELECT * FROM appointments WHERE id = ?",
    [id]
  );

  if (!existingAppointment) {
    return res.status(404).json({ message: "Cita no encontrada" });
  }

  await db.run("DELETE FROM appointments WHERE id = ?", [id]);

  res.json({ message: "Cita eliminada" });
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});