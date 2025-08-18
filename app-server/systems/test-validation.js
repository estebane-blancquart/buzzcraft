import Ajv from 'ajv'
import aSchema from '../inputs/validations/a.schema.json' with { type: "json" }
import divSchema from '../inputs/validations/div.schema.json' with { type: "json" }

const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  strict: false
})


// const validateA = ajv.compile(aSchema)
// const aTest = {
//   id: 'coucou',
//   type: 'Link',
//   name: 'aze',
//   schema: {}
// }
// const valid = validateA(aTest)
// if (valid) {
//   console.log("User data is valid!");
//   console.log(aTest)
// } else {
//   console.log("Validation errors:", validateA.errors);
// }


ajv.addSchema(aSchema)

const validateDiv = ajv.compile(divSchema)
const divTest = {
  id: 'id-div',
  type: 'div',
  name: 'test',
  components: [{
    yolo: 'a'
  }]
}

const valid = validateDiv(divTest)
if (valid) {
  console.log("User data is valid!");
  console.log(divTest)
} else {
  console.log("Validation errors:", validateDiv.errors);
}



