export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              📅
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="text-blue-600">Reserva</span>Fácil
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Sistema inteligente de reservas con disponibilidad en tiempo real, notificaciones automáticas y gestión de calendarios
          </p>
          <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">🏥 Clínicas</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">💇 Salones</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">🍽️ Restaurantes</span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">🏋️ Gimnasios</span>
          </div>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Características */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">🔐</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Autenticación JWT
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Segura y escalable
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">⚡</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tiempo Real
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Socket.io integrado
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📧</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Notificaciones
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Email automático
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              APIs Disponibles
            </h3>
            <div className="mt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Autenticación</h4>
                  <ul className="mt-2 text-sm text-gray-600">
                    <li>POST /api/auth/register</li>
                    <li>POST /api/auth/login</li>
                    <li>GET /api/auth/me</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Servicios</h4>
                  <ul className="mt-2 text-sm text-gray-600">
                    <li>GET /api/services</li>
                    <li>POST /api/services</li>
                    <li>GET /api/services/[id]</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Reservas</h4>
                  <ul className="mt-2 text-sm text-gray-600">
                    <li>GET /api/reservations</li>
                    <li>POST /api/reservations</li>
                    <li>PUT /api/reservations/[id]</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Disponibilidad</h4>
                  <ul className="mt-2 text-sm text-gray-600">
                    <li>GET /api/availability</li>
                    <li>GET /api/schedules</li>
                    <li>POST /api/schedules</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Usuarios de Prueba
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Admin: admin@reservas.com / 123456</li>
                  <li>Doctor: doctor@clinica.com / 123456</li>
                  <li>Estilista: estilista@salon.com / 123456</li>
                  <li>Cliente: cliente1@email.com / 123456</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
