# Trabajo Práctico 2:  Clinica Online

> ### Alumno: Tomás Pérez Ponisio
> ### Docentes: Augusto Morelli, Agustín Clas
***
# Resumen
> "Clínica Online" es una plataforma integral de gestión de salud diseñada para una clínica que opera tanto en línea como presencialmente, con 6 consultorios, 2 laboratorios y una sala de espera general. La clínica atiende de lunes a viernes de 8:00 a 19:00 hs y los sábados de 8:00 a 14:00 hs. La plataforma ofrece una interfaz para que los pacientes agenden turnos, los especialistas gestionen consultas, y los administradores supervisen las operaciones de la clínica.
***
# Roles y Permisos
>La plataforma está organizada en torno a tres roles principales: **Paciente, Especialista y Administrador**. Cada rol tiene acceso a funcionalidades específicas dentro del sistema:

## 1. Paciente
> * Acceso y Registro: Los pacientes pueden registrarse en la plataforma proporcionando datos personales (nombre, edad, DNI, obra social, email, contraseña e imágenes de perfil) y pasando una verificación CAPTCHA.
> * Gestión de Turnos:
>   * Ver Turnos: Los pacientes pueden ver los turnos programados.
>   * Opciones de Filtro: Los turnos pueden filtrarse por especialista o especialidad.
>   * Acciones:
>     * Cancelar: Cancelar un turno próximo con una razón opcional.
>     * Ver Reseñas: Acceder y ver reseñas de turnos completados.
>     * Completar Encuestas: Llenar encuestas de satisfacción tras los turnos completados.
>     * Calificar Especialista: Proporcionar una valoración del especialista después de una consulta.
>   * Gestión de Perfil: Ver y editar datos personales en la sección "Mi Perfil", que incluye el acceso a su historial médico registrado por los especialistas.

## 2. Especialista
> * Acceso y Registro: Los especialistas deben registrarse en la plataforma proporcionando detalles (nombre, especialidad, edad, DNI, email, contraseña e imagen de perfil). Un administrador debe aprobar el registro antes de que el especialista pueda acceder a la plataforma.
> * Gestión de Turnos:
>   * Ver Turnos Asignados: Los especialistas pueden ver y filtrar sus próximos turnos por paciente o especialidad.
>   * Acciones:
>     * Aceptar/Rechazar: Los especialistas pueden aceptar o rechazar turnos con comentarios en los rechazos.
>     * Completar: Marcar un turno como completado, incluyendo un resumen de la consulta.
>     * Agregar Historial Médico: Añadir detalles clínicos (altura, peso, temperatura, presión) y hasta tres campos personalizados al historial médico del paciente.
> * Gestión de Perfil: Los especialistas pueden configurar su disponibilidad y administrar detalles personales. También pueden revisar el historial de sus pacientes a través de la sección "Gestión de Pacientes".

## 3. Administrador
> * Acceso y Registro: Los administradores son registrados y se les otorgan permisos por otros administradores. Proporcionan información personal (nombre, edad, DNI, email, contraseña e imagen de perfil).
> * Gestión de Usuarios:
>   * Aprobar Cuentas de Especialistas: Verificar y aprobar las cuentas de especialistas para habilitar su acceso.
>   * Acceso y Gestión de Información de Pacientes y Especialistas: Ver y editar los detalles de todos los usuarios.
>   * Agregar/Deshabilitar Usuarios: Agregar nuevos pacientes, especialistas y administradores o deshabilitar cuentas de usuarios.
> * Gestión de Turnos:
>   * Ver Todos los Turnos: Acceso para ver y gestionar los turnos de todos los especialistas y pacientes.
>   * Cancelar Turnos: Cancelar turnos con un comentario opcional sobre el motivo de la cancelación.
> * Estadísticas e Informes:
>   * Generar Informes: Ver y exportar informes como inicios de sesión, turnos por especialidad y actividad de los médicos.
>   * Descargar Informes: Exportar datos de usuarios en formato Excel y descargar historiales médicos de pacientes como documentos PDF.
***
# Funcionalidades Principales
## Funcionalidades Generales
> * Gestión de Turnos: Permite que los pacientes programen, vean y cancelen turnos. Los especialistas y administradores gestionan la disponibilidad y pueden marcar turnos como completados.
> * Perfiles de Usuario e Historiales Médicos: Perfiles completos de pacientes e historiales médicos que incluyen datos fijos (altura, peso, temperatura, presión) y campos dinámicos para notas adicionales.
> * Encuestas Interactivas: Después de los turnos, los pacientes pueden completar encuestas de satisfacción para evaluar la calidad del servicio.
> * Herramientas Administrativas: Los administradores pueden ver, agregar y gestionar todos los perfiles de usuarios, turnos y datos clínicos.

## Funcionalidades Adicionales
> * Integración de CAPTCHA Responsiva: Implementada para mayor seguridad durante el registro de usuarios.
> * Soporte Multilingüe: Interfaz traducida en inglés, español y portugués.
> * Informes y Análisis: Herramientas para el seguimiento de la actividad de la clínica y la generación de informes sobre diversos indicadores como visitas, comentarios de los pacientes y calificaciones de servicios.
> * Directivas y Pipes Personalizados: UI/UX mejorada a través de pipes y directivas personalizadas en Angular para una experiencia interactiva y consistente.
***
# Requisitos Técnicos
> * Requisitos Mínimos:
>   * Pantallas de carga para mejorar la experiencia del usuario.
>   * Verificación CAPTCHA para un registro seguro.
>   * Acceso y permisos basados en el rol de usuario.
> * Requisitos Avanzados:
>   * Informes descargables en formato Excel y PDF.
>   * Animaciones de transición para una navegación fluida.
>   * Informes gráficos sobre la actividad de la clínica para los administradores.
>   * Contenido localizado en tres idiomas.

***
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
