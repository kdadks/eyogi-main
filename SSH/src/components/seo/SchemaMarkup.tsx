import React from 'react'
import { Helmet } from 'react-helmet-async'
interface SchemaMarkupProps {
  schema: object | object[]
}
export default function SchemaMarkup({ schema }: SchemaMarkupProps) {
  const schemaArray = Array.isArray(schema) ? schema : [schema]
  return (
    <Helmet>
      {schemaArray.map((schemaItem, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schemaItem, null, 2)}
        </script>
      ))}
    </Helmet>
  )
}
