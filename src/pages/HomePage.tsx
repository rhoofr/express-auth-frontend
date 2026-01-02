export default function HomePage() {
  return (
    <section className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
      <h1 className='text-4xl font-bold mb-4'>Welcome to Express Auth</h1>
      <p className='text-lg text-gray-600 dark:text-gray-300 max-w-xl'>
        This is a starter authentication frontend built with React, TypeScript, Vite, and TailwindCSS. Use the
        navigation bar to access Auth and Messages features.
      </p>
    </section>
  );
}
