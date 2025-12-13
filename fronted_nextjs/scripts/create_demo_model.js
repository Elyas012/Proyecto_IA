// Simple script to create a demo TF.js Layers model for local development
// Usage:
// 1) npm install @tensorflow/tfjs-node
// 2) node scripts/create_demo_model.js

const tf = require('@tensorflow/tfjs-node');
const path = require('path');

async function run() {
  const windowSize = 30;
  const featureCount = 6;
  const input = tf.input({ shape: [windowSize, featureCount] });
  const conv1 = tf.layers.conv1d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(input);
  const lstm = tf.layers.simpleRNN({ units: 32, returnSequences: false }).apply(conv1);
  const dense = tf.layers.dense({ units: 16, activation: 'relu' }).apply(lstm);
  const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dense);
  const model = tf.model({ inputs: input, outputs: output });
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'binaryCrossentropy' });

  const outDir = path.join(__dirname, '..', 'public', 'models', 'attention_model');
  console.log('Saving demo model to', outDir);
  await model.save(`file://${outDir}`);
  console.log('Model saved.');
}

run().catch(err => { console.error(err); process.exit(1); });
