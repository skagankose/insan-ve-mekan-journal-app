-- Reset the sequence for journalentry table
'''
 public | author_updates             | table | user
 public | journal                    | table | user
 public | journal_editor_link        | table | user
 public | journal_entry_author_link  | table | user
 public | journal_entry_referee_link | table | user
 public | journalentry               | table | user
 public | referee_updates            | table | user
 public | settings                   | table | user
 public | users                      | table | user
'''

SELECT setval('journalentry_id_seq', (SELECT MAX(id) FROM journalentry), true); 
SELECT setval('journal_id_seq', (SELECT MAX(id) FROM journal), true); 
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true); 
SELECT setval('settings_id_seq', (SELECT MAX(id) FROM settings), true); 
SELECT setval('author_updates_id_seq', (SELECT MAX(id) FROM author_updates), true); 
-- SELECT setval('journal_editor_link_id_seq', (SELECT MAX(id) FROM journal_editor_link), true); 
-- SELECT setval('journal_entry_author_link_id_seq', (SELECT MAX(id) FROM journal_entry_author_link), true); 
-- SELECT setval('journal_entry_referee_link_id_seq', (SELECT MAX(id) FROM journal_entry_referee_link), true); 
SELECT setval('referee_updates_id_seq', (SELECT MAX(id) FROM referee_updates), true); 




