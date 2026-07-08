import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedData = [
  { id: 1, fecha: '2026-07-01', municipio: 'Capital', referente: 'Carlos', concepto: 'Pavimentación B° Centro', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 50000000, montoParcial: 25000000 },
  { id: 2, fecha: '2026-07-05', municipio: 'Chilecito', referente: 'Pedro', concepto: 'Fondo Productivo', tipo: 'Subsidio', estado: 'Finalizado', montoTotal: 10000000, montoParcial: 10000000 },
  { id: 3, fecha: '2026-07-06', municipio: 'Arauco', referente: 'Marcos', concepto: 'Refacción Centro de Salud', tipo: 'Salud', estado: 'Pendiente', montoTotal: 80000000, montoParcial: 0 },
  { id: 4, fecha: '2026-07-10', municipio: 'Famatina', referente: 'Roberto', concepto: 'Red de Agua Potable', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 35000000, montoParcial: 15000000 },
  { id: 5, fecha: '2026-07-12', municipio: 'Capital', referente: 'Maria', concepto: 'Luminarias Sur', tipo: 'Infraestructura', estado: 'Finalizado', montoTotal: 20000000, montoParcial: 20000000 },
  { id: 6, fecha: '2026-07-15', municipio: 'Capital', referente: 'Jorge', concepto: 'Asistencia Comedores', tipo: 'Social', estado: 'En Ejecución', montoTotal: 15000000, montoParcial: 4500000 },
  { id: 7, fecha: '2026-07-18', municipio: 'Capital', referente: 'Ana', concepto: 'Remodelación Plaza', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 30000000, montoParcial: 15000000 },
  { id: 8, fecha: '2026-07-20', municipio: 'Capital', referente: 'Luis', concepto: 'Insumos Hospital', tipo: 'Salud', estado: 'Finalizado', montoTotal: 40000000, montoParcial: 40000000 },
  { id: 9, fecha: '2026-07-22', municipio: 'Capital', referente: 'Elena', concepto: 'Cordón Cuneta Norte', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 25000000, montoParcial: 7500000 },
  { id: 10, fecha: '2026-07-10', municipio: 'Chilecito', referente: 'Sofia', concepto: 'Vivero Municipal', tipo: 'Productivo', estado: 'En Ejecución', montoTotal: 12000000, montoParcial: 6000000 },
  { id: 11, fecha: '2026-07-14', municipio: 'Chilecito', referente: 'Diego', concepto: 'Pista Atletismo', tipo: 'Deporte', estado: 'En Ejecución', montoTotal: 22000000, montoParcial: 6600000 },
  { id: 12, fecha: '2026-07-19', municipio: 'Chilecito', referente: 'Valeria', concepto: 'Red Cloacal', tipo: 'Infraestructura', estado: 'Finalizado', montoTotal: 60000000, montoParcial: 60000000 },
  { id: 13, fecha: '2026-07-25', municipio: 'Chilecito', referente: 'Martin', concepto: 'Equipamiento Escuela', tipo: 'Educación', estado: 'Finalizado', montoTotal: 8000000, montoParcial: 8000000 },
  { id: 14, fecha: '2026-07-28', municipio: 'Chilecito', referente: 'Lucia', concepto: 'Pozo de Agua', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 35000000, montoParcial: 17500000 },
  { id: 15, fecha: '2026-08-02', municipio: 'Arauco', referente: 'Julia', concepto: 'Parque Eólico Fase 2', tipo: 'Energía', estado: 'En Ejecución', montoTotal: 150000000, montoParcial: 45000000 },
  { id: 16, fecha: '2026-08-05', municipio: 'Famatina', referente: 'Silvia', concepto: 'Apoyo Productores Nogaleros', tipo: 'Subsidio', estado: 'Finalizado', montoTotal: 18000000, montoParcial: 18000000 },
  { id: 17, fecha: '2026-08-08', municipio: 'Castro Barros', referente: 'Fernando', concepto: 'Camino Costanero', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 45000000, montoParcial: 22500000 },
  { id: 18, fecha: '2026-08-10', municipio: 'Castro Barros', referente: 'Romina', concepto: 'Reparación Escuela', tipo: 'Educación', estado: 'Finalizado', montoTotal: 9000000, montoParcial: 9000000 },
  { id: 19, fecha: '2026-08-12', municipio: 'Sanagasta', referente: 'Pablo', concepto: 'Polo Turístico', tipo: 'Turismo', estado: 'En Ejecución', montoTotal: 28000000, montoParcial: 8400000 },
  { id: 20, fecha: '2026-08-15', municipio: 'Sanagasta', referente: 'Camila', concepto: 'Asfalto Ruta Provincial', tipo: 'Infraestructura', estado: 'Finalizado', montoTotal: 75000000, montoParcial: 75000000 },
  { id: 21, fecha: '2026-08-18', municipio: 'Felipe Varela', referente: 'Andres', concepto: 'Ampliación Hospital', tipo: 'Salud', estado: 'En Ejecución', montoTotal: 90000000, montoParcial: 45000000 },
  { id: 22, fecha: '2026-08-20', municipio: 'Felipe Varela', referente: 'Florencia', concepto: 'Red Wifi Pública', tipo: 'Tecnología', estado: 'Finalizado', montoTotal: 14000000, montoParcial: 14000000 },
  { id: 23, fecha: '2026-08-22', municipio: 'Vinchina', referente: 'Gustavo', concepto: 'Defensa Aluvional', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 55000000, montoParcial: 16500000 },
  { id: 24, fecha: '2026-08-25', municipio: 'Vinchina', referente: 'Mariana', concepto: 'Refugio Alta Montaña', tipo: 'Turismo', estado: 'Finalizado', montoTotal: 21000000, montoParcial: 21000000 },
  { id: 25, fecha: '2026-08-28', municipio: 'General Lamadrid', referente: 'Ricardo', concepto: 'Planta Potabilizadora', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 65000000, montoParcial: 32500000 },
  { id: 26, fecha: '2026-09-01', municipio: 'General Lamadrid', referente: 'Patricia', concepto: 'Insumos Agrícolas', tipo: 'Productivo', estado: 'Finalizado', montoTotal: 10000000, montoParcial: 10000000 },
  { id: 27, fecha: '2026-09-03', municipio: 'General Ocampo', referente: 'Marcelo', concepto: 'Mejoramiento Barrial', tipo: 'Social', estado: 'En Ejecución', montoTotal: 30000000, montoParcial: 9000000 },
  { id: 28, fecha: '2026-09-05', municipio: 'General Ocampo', referente: 'Daniela', concepto: 'Nuevo Polideportivo', tipo: 'Deporte', estado: 'Finalizado', montoTotal: 40000000, montoParcial: 40000000 },
  { id: 29, fecha: '2026-09-08', municipio: 'General Belgrano', referente: 'Hugo', concepto: 'Reacondicionamiento Canal', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 38000000, montoParcial: 19000000 },
  { id: 30, fecha: '2026-09-10', municipio: 'General Belgrano', referente: 'Veronica', concepto: 'Microcréditos Emprendedores', tipo: 'Subsidio', estado: 'Finalizado', montoTotal: 15000000, montoParcial: 15000000 },
  { id: 31, fecha: '2026-09-12', municipio: 'General San Martín', referente: 'Sergio', concepto: 'Iluminación LED', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 24000000, montoParcial: 7200000 },
  { id: 32, fecha: '2026-09-15', municipio: 'General San Martín', referente: 'Natalia', concepto: 'Sala Primeros Auxilios', tipo: 'Salud', estado: 'Finalizado', montoTotal: 18000000, montoParcial: 18000000 },
  { id: 33, fecha: '2026-09-18', municipio: 'Rosario Vera Peñaloza', referente: 'Hector', concepto: 'Acueducto Sur', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 110000000, montoParcial: 55000000 },
  { id: 34, fecha: '2026-09-20', municipio: 'Rosario Vera Peñaloza', referente: 'Gabriela', concepto: 'Equipamiento Vial', tipo: 'Maquinaria', estado: 'Finalizado', montoTotal: 85000000, montoParcial: 85000000 },
  { id: 35, fecha: '2026-09-22', municipio: 'General Juan Facundo Quiroga', referente: 'Alejandro', concepto: 'Centro Cultural', tipo: 'Cultura', estado: 'En Ejecución', montoTotal: 32000000, montoParcial: 9600000 },
  { id: 36, fecha: '2026-09-25', municipio: 'General Juan Facundo Quiroga', referente: 'Claudia', concepto: 'Viviendas Semilla', tipo: 'Infraestructura', estado: 'Finalizado', montoTotal: 60000000, montoParcial: 60000000 },
  { id: 37, fecha: '2026-09-28', municipio: 'Chamical', referente: 'Eduardo', concepto: 'Parque Industrial', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 95000000, montoParcial: 47500000 },
  { id: 38, fecha: '2026-10-01', municipio: 'Chamical', referente: 'Monica', concepto: 'Perforación Ganadera', tipo: 'Productivo', estado: 'Finalizado', montoTotal: 26000000, montoParcial: 26000000 },
  { id: 39, fecha: '2026-10-03', municipio: 'Independencia', referente: 'Raul', concepto: 'Puente Conector', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 48000000, montoParcial: 14400000 },
  { id: 40, fecha: '2026-10-05', municipio: 'Independencia', referente: 'Lorena', concepto: 'Subsidio Transporte', tipo: 'Social', estado: 'Finalizado', montoTotal: 12000000, montoParcial: 12000000 },
  { id: 41, fecha: '2026-10-08', municipio: 'Ángel Vicente Peñaloza', referente: 'Victor', concepto: 'Extensión Red Eléctrica', tipo: 'Energía', estado: 'En Ejecución', montoTotal: 34000000, montoParcial: 17000000 },
  { id: 42, fecha: '2026-10-10', municipio: 'Ángel Vicente Peñaloza', referente: 'Andrea', concepto: 'Puesta en Valor Histórico', tipo: 'Turismo', estado: 'Finalizado', montoTotal: 16000000, montoParcial: 16000000 },
  { id: 43, fecha: '2026-10-12', municipio: 'San Blas de los Sauces', referente: 'Javier', concepto: 'Defensas Río', tipo: 'Infraestructura', estado: 'En Ejecución', montoTotal: 42000000, montoParcial: 12600000 },
  { id: 44, fecha: '2026-10-15', municipio: 'San Blas de los Sauces', referente: 'Carolina', concepto: 'Apoyo Festival Local', tipo: 'Cultura', estado: 'Finalizado', montoTotal: 8000000, montoParcial: 8000000 }
];

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.obra.deleteMany({});
  console.log('Cleared existing obras');

  // Insert seed data
  for (const data of seedData) {
    await prisma.obra.create({
      data: {
        ...data,
        fecha: new Date(data.fecha)
      }
    });
    console.log(`Created obra ${data.id}: ${data.concepto}`);
  }

  console.log(`\n✅ Successfully seeded ${seedData.length} obras`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
