const callerDocuments = [
  { 
      name: 'Contract', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Terms of Service', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Privacy Policy', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Client/Healthcare Provider Service Agreement', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Healthcare BAA', 
      type: 'Business Associate Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Confidentiality Agreement (NDA)', 
      type: 'Confidentiality Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Interpreter Availability and Scheduling Agreement', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Billing and Payment Agreement', 
      type: 'Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Emergency Protocol Agreement', 
      type: 'Protocol Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Service Level Agreement (SLA)', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Client Code of Conduct', 
      type: 'Conduct Policy', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Informed Consent Form', 
      type: 'Consent Form', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Remote Service Guidelines', 
      type: 'Guidelines', 
      status: 'Not Signed', 
      signedDate: null,  
  }
];


const agentDocuments = [
  { 
      name: 'Contract', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Terms Of Use', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Privacy Policy', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Linguist Service Agreement', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Linguist Healthcare BAA', 
      type: 'Business Associate Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Linguist HIPAA Policy', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Linguist BAA', 
      type: 'Business Associate Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Interpreter Code of Ethics', 
      type: 'Ethics Policy', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Professional Conduct Policy', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Conflict of Interest Policy', 
      type: 'Policy Document', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Continuing Education Agreement', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Cultural Competency Guidelines', 
      type: 'Guidelines', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Non-Disclosure Agreement (NDA)', 
      type: 'Confidentiality Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Technology Usage Agreement', 
      type: 'Usage Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Remote Interpreting Guidelines', 
      type: 'Guidelines', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: "Interpreter's Scope of Practice", 
      type: 'Practice Scope', 
      status: 'Not Signed', 
      signedDate: null,  
  },
  { 
      name: 'Termination of Service Agreement', 
      type: 'Service Agreement', 
      status: 'Not Signed', 
      signedDate: null,  
  }
];

module.exports = { callerDocuments, agentDocuments };
