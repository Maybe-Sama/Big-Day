/**
 * Lista de invitados de boda - datos estructurados
 * Agrupados por invitado principal + acompañantes
 */

export const guestGroups = [
  { main: "NOVIA Fernández", members: [], status: "Confirmado" },
  { main: "Mamá", members: [], status: "Confirmado" },
  { main: "Toni Ruiz", members: [], status: "Confirmado" },
  { main: "Hermano Fernández Caro", members: [], status: "Confirmado" },
  { main: "Papá", members: [], status: "Confirmado" },
  { main: "Mónica Arcas", members: [], status: "Confirmado" },
  { main: "Hermana Fernández Arcas", members: [], status: "Confirmado" },
  { main: "Patricia Gabella Arcas", members: [{ name: "Nico", rel: "Pareja" }], status: "Pendiente" },
  { main: "Abuela González Fernández", members: [], status: "Confirmado" },
  { main: "Abuelo Caro Jiménez", members: [], status: "Confirmado" },
  { main: "Abuelo Fernández Llamas", members: [], status: "Confirmado" },
  { main: "Tita Esperanza Caro", members: [
    { name: "Tito Pedro Arjona", rel: "Pareja" },
    { name: "Pedro Arjona Caro", rel: "Hijo" },
    { name: "Raúl Arjona Caro", rel: "Hijo" },
    { name: "Laura", rel: "Pareja Raúl" }
  ], status: "Confirmado" },
  { main: "Tito Jose Antonio Caro González", members: [
    { name: "Tita Silvia Marín", rel: "Pareja" },
    { name: "Román Caro Marín", rel: "Hijo" },
    { name: "Cayetano Caro Marín", rel: "Hijo" },
    { name: "Martín Caro Marín", rel: "Hijo" }
  ], status: "Confirmado" },
  { main: "Tito Jose María Fernández Utrilla", members: [{ name: "(Pareja)", rel: "Pareja" }], status: "Pendiente" },
  { main: "Tita Ani Flores", members: [
    { name: "Tito Francisco Fernández Utrilla", rel: "Pareja" },
    { name: "Adrián Fernández Flores", rel: "Hijo" },
    { name: "Mayra Fernández Flores", rel: "Hija" }
  ], status: "Confirmado" },
  { main: "Tita Elena Fernández Utrilla", members: [{ name: "Tito Francis Uber", rel: "Pareja" }], status: "Pendiente" },
  { main: "Ezequiel Uber Fernández", members: [], status: "Confirmado" },
  { main: "Francisco Javier Uber Fernández", members: [{ name: "Alexandra Alvira", rel: "Pareja" }], status: "Confirmado" },
  { main: "María Elena Uber Fernández", members: [], status: "Pendiente" },
  { main: "Tito Salva Fernández Utrilla", members: [
    { name: "Tita Mónica Pérez Hernández", rel: "Pareja" },
    { name: "Salvador Fernández", rel: "Hijo" },
    { name: "Leire Fernández", rel: "Hija" }
  ], status: "Confirmado" },
  { main: "Tita Laura Fernández Utrilla", members: [{ name: "Mateo", rel: "Hijo" }], status: "Pendiente" },
  { main: "Primo Jesús Jiménez", members: [{ name: "María del Carmen", rel: "Pareja" }], status: "Pendiente" },
  { main: "Primo Jose Mari Jiménez", members: [{ name: "María", rel: "Pareja" }], status: "Pendiente" },
  { main: "Benita López", members: [{ name: "Antonio Ruiz", rel: "Pareja" }], status: "Confirmado" },
  { main: "Carmen Ruiz Lopez", members: [
    { name: "William", rel: "Pareja" },
    { name: "William (Hijo)", rel: "Hijo", status: "Rechazado" },
    { name: "Carmen (Hija)", rel: "Hija", status: "Rechazado" }
  ], status: "Confirmado" },
  { main: "Angelines Ruiz Lopez", members: [
    { name: "Andreas", rel: "Pareja" },
    { name: "Daniel", rel: "Hijo" },
    { name: "Laura", rel: "Hija" }
  ], status: "Pendiente" },
  { main: "Diego Carrasco", members: [], status: "Pendiente" },
  { main: "Dolores", members: [], status: "Pendiente" },
  { main: "Manuel Arcas", members: [
    { name: "Loli Uber Molina", rel: "Pareja" },
    { name: "Puri Arcas", rel: "—" }
  ], status: "Confirmado" },
  { main: "Isabel Caro", members: [{ name: "Rosendo", rel: "Pareja" }], status: "Pendiente" },
  { main: "Benita Caro", members: [{ name: "Nicolás Hans", rel: "Pareja" }], status: "Pendiente" },
  { main: "Kika Caro", members: [], status: "Pendiente" },
  { main: "Juani Caro", members: [], status: "Pendiente" },
  { main: "Maria Isabel Hans", members: [{ name: "Gabriel", rel: "Pareja" }], status: "Pendiente" },
  { main: "Estefanía Arjona Hans", members: [
    { name: "Paco", rel: "Pareja" },
    { name: "Manuela", rel: "Hija" }
  ], status: "Pendiente" },
  { main: "Roberto", members: [{ name: "Pilar", rel: "Pareja" }], status: "Pendiente" },
  { main: "Óscar Rabadán", members: [{ name: "Loli", rel: "Pareja" }], status: "Pendiente" },
  { main: "Manuel Caro", members: [{ name: "Loli", rel: "Pareja" }], status: "Pendiente" },
  { main: "Eva Arcas", members: [{ name: "Juan", rel: "Pareja" }], status: "Pendiente" },
  { main: "Fernando Gil", members: [{ name: "Loli", rel: "Pareja" }], status: "Pendiente" },
  { main: "Dámaso Gil", members: [{ name: "Alicia", rel: "Pareja" }], status: "Pendiente" },
  { main: "Fernando Gil (2)", members: [{ name: "María José", rel: "Pareja" }], status: "Pendiente" },
  { main: "Juan", members: [{ name: "Claudia", rel: "Pareja" }], status: "Pendiente" },
  { main: "Cristina Jiménez", members: [{ name: "Fede", rel: "Pareja" }], status: "Pendiente" },
  { main: "María Luisa Gil", members: [], status: "Pendiente" },
  { main: "Marta Gil", members: [{ name: "Pedro", rel: "Pareja" }], status: "Pendiente" },
  { main: "Patricia Rodríguez", members: [{ name: "Javier", rel: "Pareja" }], status: "Pendiente" },
  { main: "Censi Pavón", members: [{ name: "Jose Manuel", rel: "Pareja" }], status: "Pendiente" },
  { main: "Ana Alfaro", members: [{ name: "David", rel: "Pareja" }], status: "Pendiente" },
  { main: "María Elena Valderrama", members: [], status: "Pendiente" },
  { main: "Ainhoa Jiménez", members: [], status: "Pendiente" },
  { main: "Cristina Moral", members: [{ name: "David", rel: "Pareja" }], status: "Pendiente" },
  { main: "María Bermudo", members: [{ name: "Paco", rel: "Pareja" }], status: "Pendiente" },
  { main: "Sara Ruiz", members: [{ name: "Pablo", rel: "Pareja" }], status: "Pendiente" },
  { main: "Cristina Ruiz", members: [{ name: "Jorge", rel: "Pareja" }], status: "Pendiente" },
  { main: "Javier Rodríguez", members: [{ name: "Bea", rel: "Pareja" }], status: "Pendiente" },
  { main: "Jose María Orejuela", members: [{ name: "Silvia", rel: "Pareja" }], status: "Pendiente" },
  { main: "Rafael Aguilar", members: [{ name: "Mari Carmen", rel: "Pareja" }], status: "Pendiente" },
  { main: "Alberto García", members: [{ name: "Serena", rel: "Pareja" }], status: "Pendiente" },
  { main: "Ángel Cadenas", members: [{ name: "Virginia", rel: "Pareja" }], status: "Pendiente" },
  { main: "Manuel Aguilar", members: [{ name: "María José", rel: "Pareja" }], status: "Pendiente" },
  { main: "María de los Ángeles Arroyo", members: [{ name: "Jesús", rel: "Pareja" }], status: "Pendiente" },
  { main: "Sara Salgado", members: [], status: "Pendiente" },
  { main: "Ana Sánchez", members: [], status: "Pendiente" },
  { main: "Alicia Sha", members: [], status: "Pendiente" },
  { main: "Rocío Martínez", members: [], status: "Pendiente" },
  { main: "Carmen Martínez", members: [], status: "Pendiente" },
  { main: "Carmen Viera", members: [], status: "Pendiente" },
  { main: "María de los Ángeles Sotillo", members: [], status: "Pendiente" },
  { main: "Helena Sánchez", members: [], status: "Pendiente" },
  { main: "Isabel Chamizo", members: [], status: "Pendiente" },
  { main: "Lucía Gómez", members: [], status: "Pendiente" },
  { main: "Katheryn Trujillo", members: [], status: "Pendiente" },
  { main: "María del Mar Adame", members: [], status: "Pendiente" },
  // Lado del novio
  { main: "NOVIO Díaz", members: [], status: "Confirmado" },
  { main: "Mamá (Novio)", members: [], status: "Confirmado" },
  { main: "Papá (Novio)", members: [], status: "Confirmado" },
  { main: "Abuela (Novio)", members: [], status: "Confirmado" },
  { main: "Tito Miguel Ángel Díaz García", members: [{ name: "María José Sánchez Bueno", rel: "Pareja" }], status: "Confirmado" },
  { main: "Tita María José Sánchez Bueno", members: [], status: "Pendiente" },
  { main: "Ángel Díaz Sánchez", members: [{ name: "Alexandra Lara Ruiz", rel: "Pareja" }], status: "Confirmado" },
  { main: "Paula Díaz Sánchez", members: [{ name: "Rafa Montero Arroyo", rel: "Pareja" }], status: "Confirmado" },
  { main: "Pedro Sánchez Bueno", members: [{ name: "Ana", rel: "Pareja" }], status: "Pendiente" },
  { main: "Tita Laura Martínez Perdigones", members: [
    { name: "Antonio Pavón López", rel: "Pareja" },
    { name: "Iván Pavón Martínez", rel: "Hijo" },
    { name: "Miriam Perez Fernandez", rel: "Pareja Iván" },
    { name: "Laura Pavón Martínez", rel: "Hija" }
  ], status: "Confirmado" },
  { main: "Tito Antonio Martínez Perdigones", members: [
    { name: "Tita Mercedes Postigo Almán", rel: "Pareja" },
    { name: "Antonio Martínez Postigo", rel: "Hijo" },
    { name: "María Rodríguez Carvajal", rel: "Pareja Antonio M. Postigo" }
  ], status: "Confirmado" },
  { main: "Encarnación Díaz Muñoz", members: [], status: "Confirmado" },
  { main: "María José Sánchez Díaz", members: [
    { name: "Antonio Gil", rel: "Pareja" },
    { name: "Adrián Gil Sánchez", rel: "Hijo" },
    { name: "Macarena", rel: "Pareja Adrián" }
  ], status: "Confirmado" },
  { main: "Cristina Gil Sánchez", members: [], status: "Pendiente" },
  { main: "Enrique García Rojas", members: [{ name: "Isabel Galera", rel: "Pareja" }], status: "Confirmado" },
  { main: "Emilio García Galera", members: [], status: "Pendiente" },
  { main: "Miriam García", members: [
    { name: "Aderra Baahmed", rel: "Pareja" },
    { name: "Yasmina Baahmed Garcia", rel: "Hija" }
  ], status: "Confirmado" },
  { main: "Sofía García Galera", members: [
    { name: "Abraham Torquemada", rel: "Pareja" },
    { name: "Sofía", rel: "Hija" },
    { name: "Juan Manuel", rel: "Pareja" }
  ], status: "Confirmado" },
  { main: "Isabel Torquemada García", members: [{ name: "Ramón Muñoz León", rel: "Pareja" }], status: "Confirmado" },
  { main: "Sofía Torquemada García", members: [{ name: "Juanma", rel: "Pareja" }], status: "Pendiente" },
  { main: "Daniel García García", members: [
    { name: "Carolina Morales", rel: "Pareja" },
    { name: "Daniel García", rel: "Hijo" }
  ], status: "Pendiente" },
  { main: "María del Mar Ruiz García", members: [
    { name: "Luis Fuentes", rel: "Pareja" },
    { name: "Cándida García Rojas", rel: "Madre" },
    { name: "Ainhoa Fuentes Ruiz", rel: "Hija" },
    { name: "Rafael Pérez", rel: "Pareja Ainhoa" },
    { name: "David Fuentes Ruiz", rel: "Hijo" }
  ], status: "Confirmado" },
  { main: "Montserrat Ruiz García", members: [
    { name: "Juan Carrera", rel: "Pareja" },
    { name: "Yeray Carrera Ruiz", rel: "Hijo" },
    { name: "Samuel Carrera Ruiz", rel: "—" }
  ], status: "Confirmado" },
  { main: "Victoria García Rojas", members: [{ name: "Gonzalo Ruiz", rel: "Pareja" }], status: "Pendiente" },
  { main: "Irene Ruiz García", members: [{ name: "Noelia", rel: "Pareja" }], status: "Pendiente" },
  { main: "Gonzalo Ruiz García", members: [], status: "Confirmado" },
  { main: "Laura Ruiz García", members: [
    { name: "Jose Manuel Gutierrez Liñán", rel: "Pareja" },
    { name: "Elio", rel: "Hijo" },
    { name: "Abril", rel: "Hija" },
    { name: "Adriano", rel: "Hijo" }
  ], status: "Pendiente" },
  { main: "Victoria Ruiz García", members: [{ name: "Antonio Rodríguez Delgado", rel: "Pareja" }], status: "Confirmado" },
  { main: "Antonio Rodríguez", members: [{ name: "Carmen Súñer Herrera", rel: "Pareja" }], status: "Confirmado" },
  { main: "Mariela Rodríguez", members: [{ name: "(Pareja Mariela)", rel: "Pareja" }], status: "Pendiente" },
  { main: "Luis Aibar Rodríguez", members: [{ name: "Ana Calderón García", rel: "Pareja" }], status: "Pendiente" },
  { main: "Pepa Limón", members: [{ name: "Juan Carlos Cerca", rel: "Pareja" }], status: "Pendiente" },
  { main: "Ester Martínez Perdigones", members: [
    { name: "Raúl Méndez", rel: "Pareja" },
    { name: "Raúl Méndez Martínez", rel: "Hijo" },
    { name: "Paula Méndez Martínez", rel: "Hija" }
  ], status: "Confirmado" },
  { main: "Elisabeth Martínez Perdigones", members: [
    { name: "Ricardo Álvarez López", rel: "Pareja" },
    { name: "Marco", rel: "Hijo" },
    { name: "Carmen", rel: "Hija" }
  ], status: "Confirmado" },
  { main: "Sara Carrasco Adame", members: [{ name: "Fernando Cañizares Romero", rel: "Pareja" }], status: "Pendiente" },
  { main: "Ángel Cañizares Romero", members: [{ name: "Cristina Reina", rel: "Pareja" }], status: "Confirmado" },
  { main: "Jesús García Gómez", members: [], status: "Confirmado" },
  { main: "María Pérez Ornedo", members: [{ name: "Joao", rel: "Pareja" }], status: "Pendiente" },
  { main: "David Peña Garci", members: [{ name: "Amanda Izquierdo", rel: "Pareja" }], status: "Confirmado" },
  { main: "Alejandro Vidal Sánchez", members: [], status: "Confirmado" },
  { main: "Álvaro Galo Tutor", members: [], status: "Confirmado" },
  { main: "Manuel Durán", members: [{ name: "Elizabeth Neva", rel: "Pareja" }], status: "Confirmado" },
  { main: "Jose Ángel Jiménez Montaño", members: [], status: "Pendiente" },
];
