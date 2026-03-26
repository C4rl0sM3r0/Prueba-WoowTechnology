import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function Detail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    api.get("/appointments")
      .then((res) => {
        const found = res.data.find((a: any) => a.id === Number(id));
        setAppointment(found);
      })
      .catch((err) => console.error(err));
  }, [id]);

  if (!appointment) return <p>Cargando...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Detalle de Cita</h2>

      <p><strong>Paciente:</strong> {appointment.patientName}</p>
      <p><strong>Doctor:</strong> {appointment.doctorName}</p>
      <p><strong>Fecha:</strong> {appointment.appointmentDate}</p>
      <p><strong>Hora:</strong> {appointment.appointmentTime}</p>
      <p><strong>Motivo:</strong> {appointment.reason}</p>
      <p><strong>Estado:</strong> {appointment.status}</p>

      <Link to="/">⬅ Volver</Link>
    </div>
  );
}

export default Detail;