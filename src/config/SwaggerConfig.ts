
	import swaggerJSDoc from 'swagger-jsdoc';

	const options = {
		definition: {
			openapi: '3.1.0',
            info: { title: 'Tradingcardshand', description: '', version: '1.0.0' }
		},
		// Where to look for JSDoc comments
		apis: [
			'./src/routes/**/*.ts',
			'./src/controllers/**/*.ts',
			'./src/models/**/*.ts'
		],
	};

// Generate the complete specification
	const swaggerSpec = swaggerJSDoc(options);

	export default swaggerSpec;
