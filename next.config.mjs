/** @type {import('next').NextConfig} */
const nextConfig = {
  // Com mais de uma instância atrás do ALB, todas precisam do mesmo build ID; senão a
  // página vem de uma e o _buildManifest é pedido à outra (404 / "Application error").
  // O deploy passa BUILD_ID = commit do clone; sem ele, o Next gera um ID aleatório.
  generateBuildId: async () => process.env.BUILD_ID || null,
};
export default nextConfig;
