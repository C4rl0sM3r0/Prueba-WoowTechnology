import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const initDB = async () => {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT NOT NULL,
      doctorName TEXT NOT NULL,
      appointmentDate TEXT NOT NULL,
      appointmentTime TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  return db;
};