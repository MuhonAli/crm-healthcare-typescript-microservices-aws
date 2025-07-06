import asyncHandler from "express-async-handler";
import Contact from "../models/contactModel.js";
import { v4 as uuidv4 } from 'uuid';
import { isInvalidContactEmailPayload, formatBulkContactEmailPayload, getGMTEpochTime } from "../utils/validateBulkEmailSmsContactPayload.js";
import EmailHistory from "../models/emailHistoryModel.js";
import moment from "moment-timezone";

// process hourly based email
async function processContactsEmailForHours(req, res, contactEmailPayload, scheduledDate, endDate, contactIds) {
  
  const batchQuantity = contactEmailPayload?.batch_schedule[0]?.batch_quantity;
  let filteredIds = [];
  if (batchQuantity >= contactIds?.length) {
      filteredIds = contactIds?.slice(); // take all remaining IDs
  } else {
      filteredIds = contactIds?.slice(0, batchQuantity); // take IDs based on batch quantity
  }

  // Remove the filtered IDs from the original data array
  contactIds = contactIds?.filter(id => !filteredIds?.includes(id));


  for (let item = 0; item < filteredIds?.length; item++) {
      try {
        
          // Search for requested contact
          const foundContact = await Contact.findById(filteredIds[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {

            const data = {
              organization_id: contactEmailPayload?.organization_id,
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              to:{
                    email: foundContact?.email, // required field
                    name: foundContact?.first_name // optional field
                },
              from: contactEmailPayload?.from,
              subject: contactEmailPayload?.subject, // required field
              content: contactEmailPayload?.content,
              attachments: contactEmailPayload?.attachments,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              send_at: scheduledDate,
              is_tried: false,
              is_sent: false,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledEmailHistory = new EmailHistory(data);
            await scheduledEmailHistory.save();
          }
      } catch (err) {
          continue;
      }
  }

  // Increase scheduled date by repeat_after_value
  const repeatAfterValue = contactEmailPayload?.batch_schedule[0]?.repeat_after_value;
  const newScheduledDate = new Date(scheduledDate);
  newScheduledDate.setHours(newScheduledDate.getHours() + repeatAfterValue);

  // Check if scheduled date is less than end date for recursion
  if (new Date(newScheduledDate) <= endDate) {
      
      // Call processContactsEmailForHours recursively with updated scheduled date
      await processContactsEmailForHours(req, res, contactEmailPayload, newScheduledDate, endDate, contactIds);
  } else {

    return res.status(200).json({
      message: `Processed all contacts, successfully posted all emails.`,
    });
  }
}


// process days based email
async function processContactsEmailForDays(req, res, contactEmailPayload, scheduledDate, endDate, contactIds) {
  const batchQuantity = contactEmailPayload?.batch_schedule[0]?.batch_quantity;

  let filteredIds = [];
  if (batchQuantity >= contactIds?.length) {
      filteredIds = contactIds?.slice(); // take all remaining IDs
  } else {
      filteredIds = contactIds?.slice(0, batchQuantity); // take IDs based on batch quantity
  }

  // Remove the filtered IDs from the original data array
  contactIds = contactIds?.filter(id => !filteredIds?.includes(id));

  for (let item = 0; item < filteredIds?.length; item++) {
      try {
        
          // Search for requested contact
          const foundContact = await Contact.findById(filteredIds[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {

            const data = {
              organization_id: contactEmailPayload?.organization_id,
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              to:{
                    email: foundContact?.email, // required field
                    name: foundContact?.first_name // optional field
                },
              from: contactEmailPayload?.from,
              subject: contactEmailPayload?.subject, // required field
              content: contactEmailPayload?.content,
              attachments: contactEmailPayload?.attachments,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              send_at: scheduledDate,
              is_tried: false,
              is_sent: false,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledEmailHistory = new EmailHistory(data);
            await scheduledEmailHistory.save();
          }
      } catch (err) {
          continue;
      }
  }

  
  // Increase scheduled date by repeat_after_value
  const repeatAfterValue = contactEmailPayload?.batch_schedule[0]?.repeat_after_value;
  const newScheduledDate = new Date(scheduledDate);
  newScheduledDate.setDate(newScheduledDate.getDate() + repeatAfterValue);

  // Check if scheduled date is less than end date for recursion
  if (new Date(newScheduledDate) <= endDate) {
    
      // Call processContactsEmailForDays recursively with updated scheduled date
      await processContactsEmailForDays(req, res, contactEmailPayload, newScheduledDate, endDate, contactIds);
  } else {
    return res.status(200).json({
      message: `Processed all contacts, successfully posted all emails.`,
  });
  }
}

// process month based email
async function processContactsEmailsForMonth(req, res, contactEmailPayload, scheduledDate, endDate, contactIds) {
  const batchQuantity = contactEmailPayload?.batch_schedule[0]?.batch_quantity;

  let filteredIds = [];
  if (batchQuantity >= contactIds?.length) {
      filteredIds = contactIds?.slice(); // take all remaining IDs
  } else {
      filteredIds = contactIds?.slice(0, batchQuantity); // take IDs based on batch quantity
  }

  // Remove the filtered IDs from the original data array
  contactIds = contactIds?.filter(id => !filteredIds?.includes(id));

  for (let item = 0; item < filteredIds?.length; item++) {
      try {
        
          // Search for requested contact
          const foundContact = await Contact.findById(filteredIds[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {
            
            const data = {
              organization_id: contactEmailPayload?.organization_id,
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              to:{
                    email: foundContact?.email, // required field
                    name: foundContact?.first_name // optional field
                },
              from: contactEmailPayload?.from,
              subject: contactEmailPayload?.subject, // required field
              content: contactEmailPayload?.content,
              attachments: contactEmailPayload?.attachments,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              send_at: scheduledDate,
              is_tried: false,
              is_sent: false,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }
            
            const scheduledEmailHistory = new EmailHistory(data);
            await scheduledEmailHistory.save();

          }
      } catch (err) {
          continue;
      }
  }

  
  // Increase scheduled date by repeat_after_value
  const repeatAfterValue = contactEmailPayload?.batch_schedule[0]?.repeat_after_value;
  const newScheduledDate = new Date(scheduledDate);
  newScheduledDate.setMonth(newScheduledDate.getMonth() + repeatAfterValue);

  // Check if scheduled date is less than end date for recursion
  if (new Date(newScheduledDate) <= endDate) {
    
      // Call processContactsEmailsForMonth recursively with updated scheduled date
      await processContactsEmailsForMonth(req, res, contactEmailPayload, newScheduledDate, endDate, contactIds);
  } else {

    return res.status(200).json({
      message: `Processed all contacts, successfully posted all emails.`,
    });
  }
}


// Add Bulk Contact Email
export const addBulkContactEmail = asyncHandler(async (req, res) => {
    // Check if any empty value is passed in
    const errorMessage = isInvalidContactEmailPayload(req.body);
  
    if (errorMessage) {
      // if so, send the error message with 400
      return res.status(400).json({ message: errorMessage });
    }
  
    // format contact payload from the request
    const contactEmailPayload = formatBulkContactEmailPayload(req);
   
    if(contactEmailPayload?.operation_type === 'Add all at once') {

      for(let item = 0; item < contactEmailPayload?.contact_id_array?.length; item = item + 1){
        try {
            // Search for requested contact
            const foundContact = await Contact.findById(contactEmailPayload?.contact_id_array[item]);
            if (foundContact && foundContact.organization_id === req.user.organization_id) {

            const data = {
              organization_id: contactEmailPayload?.organization_id,
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              to:{
                    email: foundContact?.email, // required field
                    name: foundContact?.first_name // optional field
                },
              from: contactEmailPayload?.from,
              subject: contactEmailPayload?.subject, // required field
              content: contactEmailPayload?.content,
              attachments: contactEmailPayload?.attachments,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              send_at: contactEmailPayload?.scheduled_date_time,
              is_tried: false,
              is_sent: false,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledEmailHistory = new EmailHistory(data);
            await scheduledEmailHistory.save();
        
          }
        } catch (err) {
          continue;
        }
     }
     return res.status(200).json({
      message: `Processed all contacts, successfully posted all emails.`,
    });

    } else if(contactEmailPayload?.operation_type === 'Add all at schedule time') {
      
         for(let item = 0; item < contactEmailPayload?.contact_id_array?.length; item = item + 1){
            try {
              
                // Search for requested contact
                const foundContact = await Contact.findById(contactEmailPayload?.contact_id_array[item]);
                if (foundContact && foundContact.organization_id === req.user.organization_id) {

                  const data = {
                    organization_id: contactEmailPayload?.organization_id,
                    inbound: false,
                    recipient: {
                      first_name: foundContact.first_name,
                    },
                    sender: {
                      sender_id: req.user.id,
                      first_name: req.user.first_name,
                      is_active: req.user.is_active,
                      profile_pic_url: req.user?.profile_pic_url ?? undefined,
                    },
                    to:{
                          email: foundContact?.email, // required field
                          name: foundContact?.first_name // optional field
                      },
                    from: contactEmailPayload?.from,
                    subject: contactEmailPayload?.subject, // required field
                    content: contactEmailPayload?.content,
                    attachments: contactEmailPayload?.attachments,
                    batch_id: `CALYSTRA-PRO${uuidv4()}`,
                    send_at: contactEmailPayload?.scheduled_date_time,
                    is_tried: false,
                    is_sent: false,
                    created_at: moment().tz("Etc/UTC"),
                    updated_at: moment().tz("Etc/UTC"),
                  }
      
                  const scheduledEmailHistory = new EmailHistory(data);
                  await scheduledEmailHistory.save();
              }
            } catch (err) {
              continue;
            }
         }
   
        return res.status(200).json({
          message: `Processed all contacts, successfully posted all emails.`,
        });

    } else if (contactEmailPayload?.operation_type === 'Add in drip mode') {

      if(contactEmailPayload?.batch_schedule[0]?.repeat_after_type === "hours") {
        let startDateFromPayload = contactEmailPayload?.batch_schedule[0]?.start_date_time;
        let scheduledDate = new Date(getGMTEpochTime({
          send_at: startDateFromPayload
        }) * 1000);

        let lastDateFromPayload = contactEmailPayload?.batch_schedule[0]?.end_date_time
        const endDate = new Date(getGMTEpochTime({
          send_at: lastDateFromPayload
        }) * 1000);

        const contactIds = contactEmailPayload?.contact_id_array;
    
        if (new Date(scheduledDate) <= endDate && contactIds?.length > 0) {
             
            await processContactsEmailForHours(req, res, contactEmailPayload, scheduledDate, endDate, contactIds);
        } else {

            return res.status(200).json({
              message: "Scheduled date exceeds end date or no contacts available.",
          });
        }

      }

      if(contactEmailPayload?.batch_schedule[0]?.repeat_after_type === "days") {
        
        const startDateFromPayload = contactEmailPayload?.batch_schedule[0]?.start_date_time;
        let scheduledDate = new Date(getGMTEpochTime({
          send_at: startDateFromPayload
        }) * 1000);

        const lastDateFromPayload = contactEmailPayload?.batch_schedule[0]?.end_date_time
        const endDate = new Date(getGMTEpochTime({
          send_at: lastDateFromPayload
        }) * 1000);
        const contactIds = contactEmailPayload?.contact_id_array;
    
        if (new Date(scheduledDate) <= endDate && contactIds?.length > 0) {
            
            await processContactsEmailForDays(req, res, contactEmailPayload, scheduledDate, endDate, contactIds);
        } else {
          return res.status(200).json({
            message: "Scheduled date exceeds end date or no contacts available.",
          });
        }
      }

      if(contactEmailPayload?.batch_schedule[0]?.repeat_after_type === "months") {
        const startDateFromPayload = contactEmailPayload?.batch_schedule[0]?.start_date_time;
        let scheduledDate = new Date(getGMTEpochTime({
          send_at: startDateFromPayload
        }) * 1000);

        const lastDateFromPayload = contactEmailPayload?.batch_schedule[0]?.end_date_time
        const endDate = new Date(getGMTEpochTime({
          send_at: lastDateFromPayload
        }) * 1000);
        const contactIds = contactEmailPayload?.contact_id_array;
    
        if (new Date(scheduledDate) <= endDate && contactIds?.length > 0) {
            
            await processContactsEmailsForMonth(req, res, contactEmailPayload, scheduledDate, endDate, contactIds);
        } else {
          return res.status(200).json({
            message: "Scheduled date exceeds end date or no contacts available.",
          });
        }
      }

    } else {
      return res.status(200).json({
        messages: "Operation type are not matched with any operations.",
      });
    }

});


