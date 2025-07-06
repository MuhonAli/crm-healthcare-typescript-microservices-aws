export function isBoolean(argument) {
  return typeof argument === "boolean";
}

// convert to a valid number or return the default
export function convertToNumberOrDefault(input, defaultValue) {
  const parsedNumber = parseInt(input, 10); // Parse the input to an integer

  // Check if the parsedNumber is a valid integer and not NaN
  if (
    !isNaN(parsedNumber) &&
    Number.isInteger(parsedNumber) &&
    parsedNumber > 0
  ) {
    return parsedNumber; // Return the validated integer
  } else {
    return defaultValue; // Return the default value if input is invalid
  }
}
