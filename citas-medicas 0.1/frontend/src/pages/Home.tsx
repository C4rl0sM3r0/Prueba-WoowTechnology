import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../App.css";

interface Appointment {
  id: number;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: "pendiente" | "confirmada" | "cancelada";
  createdAt: string;
}

type StatusFilter = "todos" | "pendiente" | "confirmada" | "cancelada";

function Home() {
  const initialForm = {
    patientName: "",
    doctorName: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: ""
  };

  const availableTimes = [
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

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const today = new Date().toISOString().split("T")[0];

  const getAppointments = () => {
    api.get("/appointments")
      .then((res) => setAppointments(res.data))
      .catch(() => showMessage("Error al cargar las citas", "error"));
  };

  useEffect(() => {
    getAppointments();
  }, []);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (
      !form.patientName.trim() ||
      !form.doctorName.trim() ||
      !form.appointmentDate.trim() ||
      !form.appointmentTime.trim() ||
      !form.reason.trim()
    ) {
      showMessage("Todos los campos son obligatorios", "error");
      return false;
    }

    if (form.patientName.trim().length < 3) {
      showMessage("El nombre del paciente debe tener al menos 3 caracteres", "error");
      return false;
    }

    if (form.doctorName.trim().length < 3) {
      showMessage("El nombre del doctor debe tener al menos 3 caracteres", "error");
      return false;
    }

    if (form.reason.trim().length < 5) {
      showMessage("El motivo debe tener al menos 5 caracteres", "error");
      return false;
    }

    if (form.appointmentDate < today) {
      showMessage("No se permiten fechas pasadas", "error");
      return false;
    }

    if (!availableTimes.includes(form.appointmentTime)) {
      showMessage("Seleccione una hora válida de atención", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (editingId !== null) {
      api.put(`/appointments/${editingId}`, form)
        .then(() => {
          getAppointments();
          resetForm();
          showMessage("Cita actualizada correctamente");
        })
        .catch((err) => {
          const backendMessage =
            err?.response?.data?.message || "Error al actualizar la cita";
          showMessage(backendMessage, "error");
        });
    } else {
      api.post("/appointments", form)
        .then(() => {
          getAppointments();
          resetForm();
          showMessage("Cita creada correctamente");
        })
        .catch((err) => {
          const backendMessage =
            err?.response?.data?.message || "Error al crear la cita";
          showMessage(backendMessage, "error");
        });
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setForm({
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      reason: appointment.reason
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteAppointment = (id: number) => {
    api.delete(`/appointments/${id}`)
      .then(() => {
        getAppointments();
        showMessage("Cita eliminada correctamente");
      })
      .catch(() => showMessage("Error al eliminar la cita", "error"));
  };

  const updateStatus = (
    id: number,
    status: "pendiente" | "confirmada" | "cancelada"
  ) => {
    api.patch(`/appointments/${id}/status`, { status })
      .then(() => {
        getAppointments();
        showMessage(`Estado actualizado a ${status}`);
      })
      .catch(() => showMessage("Error al actualizar el estado", "error"));
  };

  const filteredAppointments = useMemo(() => {
    const text = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch = appointment.patientName.toLowerCase().includes(text);
      const matchesStatus =
        statusFilter === "todos" || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  return (
    <div className="container">
      <h1>Gestión de Citas Médicas</h1>

      {message && (
        <div className={`alert ${messageType}`}>
          {message}
        </div>
      )}

      <div className="dashboard-layout">
        <section className="left-panel">
          <div className="panel card-panel">
            <h2>{editingId !== null ? "Editar Cita" : "Crear Cita"}</h2>

            <form onSubmit={handleSubmit} className="form">
              <input
                name="patientName"
                placeholder="Paciente"
                value={form.patientName}
                onChange={handleChange}
                required
              />

              <input
                name="doctorName"
                placeholder="Doctor"
                value={form.doctorName}
                onChange={handleChange}
                required
              />

              <input
                type="date"
                name="appointmentDate"
                value={form.appointmentDate}
                onChange={handleChange}
                min={today}
                required
              />

              <select
                name="appointmentTime"
                value={form.appointmentTime}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una hora</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <input
                name="reason"
                placeholder="Motivo"
                value={form.reason}
                onChange={handleChange}
                required
              />

              <div className="form-actions">
                <button type="submit">
                  {editingId !== null ? "Actualizar Cita" : "Crear Cita"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel card-panel">
            <h2>Búsqueda y Filtros</h2>

            <div className="filters-column">
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </section>

        <section className="right-panel">
          <div className="panel card-panel">
            <h2>Lista de Citas</h2>

            <div className="cards">
              {filteredAppointments.length === 0 ? (
                <p className="empty-message">No se encontraron citas.</p>
              ) : (
                filteredAppointments.map((a) => (
                  <div key={a.id} className="card">
                    <div className="card-header">
                      <h3>{a.patientName}</h3>
                      <span className={`status-badge ${a.status}`}>
                        {a.status}
                      </span>
                    </div>

                    <p><strong>Doctor:</strong> {a.doctorName}</p>
                    <p><strong>Fecha:</strong> {a.appointmentDate}</p>
                    <p><strong>Hora:</strong> {a.appointmentTime}</p>
                    <p><strong>Motivo:</strong> {a.reason}</p>
                    <p><strong>Creada:</strong> {new Date(a.createdAt).toLocaleString()}</p>

                    <Link to={`/appointment/${a.id}`} className="detail-link">
                      Ver detalle
                    </Link>

                    <div className="buttons">
                      <button onClick={() => handleEdit(a)}>
                        Editar
                      </button>

                      <button onClick={() => updateStatus(a.id, "confirmada")}>
                        Confirmar
                      </button>

                      <button onClick={() => updateStatus(a.id, "cancelada")}>
                        Cancelar
                      </button>

                      <button
                        className="delete"
                        onClick={() => deleteAppointment(a.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;