const conversionTypeSelect = document.getElementById('conversionType');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const inputValue = document.getElementById('inputValue');
const resultValue = document.getElementById('resultValue');

const conversions = {
  length: {
    units: ['meter', 'kilometer', 'centimeter', 'millimeter', 'mile', 'yard', 'foot', 'inch'],
    factors: {
      meter: 1,
      kilometer: 0.001,
      centimeter: 100,
      millimeter: 1000,
      mile: 0.000621371,
      yard: 1.09361,
      foot: 3.28084,
      inch: 39.3701
    }
  },
  weight: {
    units: ['kilogram', 'gram', 'milligram', 'pound', 'ounce'],
    factors: {
      kilogram: 1,
      gram: 1000,
      milligram: 1000000,
      pound: 2.20462,
      ounce: 35.274
    }
  },
  area: {
    units: ['square meter', 'square kilometer', 'square mile', 'square yard', 'square foot', 'acre', 'hectare'],
    factors: {
      'square meter': 1,
      'square kilometer': 0.000001,
      'square mile': 3.861e-7,
      'square yard': 1.19599,
      'square foot': 10.7639,
      'acre': 0.000247105,
      'hectare': 0.0001
    }
  },
  volume: {
    units: ['cubic meter', 'liter', 'milliliter', 'cubic foot', 'cubic inch', 'gallon'],
    factors: {
      'cubic meter': 1,
      'liter': 1000,
      'milliliter': 1000000,
      'cubic foot': 35.3147,
      'cubic inch': 61023.7,
      'gallon': 264.172
    }
  },
  speed: {
    units: ['meter per second', 'kilometer per hour', 'miles per hour', 'foot per second'],
    factors: {
      'meter per second': 1,
      'kilometer per hour': 3.6,
      'miles per hour': 2.23694,
      'foot per second': 3.28084
    }
  },
  temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    convert: function (value, from, to) {
      if (from === to) return value;
      if (from === 'Celsius') {
        if (to === 'Fahrenheit') return value * 9/5 + 32;
        if (to === 'Kelvin') return value + 273.15;
      }
      if (from === 'Fahrenheit') {
        if (to === 'Celsius') return (value - 32) * 5/9;
        if (to === 'Kelvin') return (value - 32) * 5/9 + 273.15;
      }
      if (from === 'Kelvin') {
        if (to === 'Celsius') return value - 273.15;
        if (to === 'Fahrenheit') return (value - 273.15) * 9/5 + 32;
      }
    }
  }
};

function populateUnits() {
  const selectedType = conversionTypeSelect.value;
  const units = conversions[selectedType].units;

  fromUnitSelect.innerHTML = '';
  toUnitSelect.innerHTML = '';

  units.forEach(unit => {
    const option1 = document.createElement('option');
    option1.textContent = unit;
    option1.value = unit;
    fromUnitSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.textContent = unit;
    option2.value = unit;
    toUnitSelect.appendChild(option2);
  });

  performConversion();
}

function performConversion() {
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const value = parseFloat(inputValue.value);
  const selectedType = conversionTypeSelect.value;

  if (isNaN(value)) {
    resultValue.textContent = 'Invalid input';
    return;
  }

  let result;

  if (selectedType === 'temperature') {
    result = conversions.temperature.convert(value, fromUnit, toUnit);
  } else {
    const fromFactor = conversions[selectedType].factors[fromUnit];
    const toFactor = conversions[selectedType].factors[toUnit];
    result = (value / fromFactor) * toFactor;
  }

  resultValue.textContent = result.toFixed(4);
}

conversionTypeSelect.addEventListener('change', populateUnits);
fromUnitSelect.addEventListener('change', performConversion);
toUnitSelect.addEventListener('change', performConversion);
inputValue.addEventListener('input', performConversion);

populateUnits();